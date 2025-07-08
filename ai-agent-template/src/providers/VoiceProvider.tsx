import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import "webrtc-adapter";

// Voice participant interface
interface VoiceParticipant {
  id: string;
  name: string;
  isMuted: boolean;
  isCurrentUser: boolean;
  audioLevel: number;
  isConnected: boolean;
}

// Voice transcript interface
interface VoiceTranscript {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  timestamp: Date;
  isComplete: boolean;
}

// WebRTC connection interface
interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

interface VoiceContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  roomId: string | null;
  
  // Audio state
  isMuted: boolean;
  isDeafened: boolean;
  volume: number;
  
  // Participants
  participants: VoiceParticipant[];
  localParticipant: VoiceParticipant | null;
  
  // Transcripts
  transcripts: VoiceTranscript[];
  isTranscribing: boolean;
  
  // Actions
  joinRoom: (roomId: string, userName: string) => Promise<void>;
  leaveRoom: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  setVolume: (volume: number) => void;
  startTranscription: () => void;
  stopTranscription: () => void;
  clearTranscripts: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [roomId, setRoomId] = useState<string | null>("main-room");
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [volume, setVolumeState] = useState(1);
  
  // Participants with mock data
  const [participants, setParticipants] = useState<VoiceParticipant[]>([
    {
      id: "mock-user-1",
      name: "Alice (Mock)",
      isMuted: false,
      isCurrentUser: false,
      audioLevel: 0.3,
      isConnected: true
    },
    {
      id: "mock-user-2", 
      name: "Bob (Mock)",
      isMuted: true,
      isCurrentUser: false,
      audioLevel: 0,
      isConnected: true
    }
  ]);
  const [localParticipant, setLocalParticipant] = useState<VoiceParticipant | null>(null);
  
  // Transcripts with mock data
  const [transcripts, setTranscripts] = useState<VoiceTranscript[]>([
    {
      id: "mock-1",
      participantId: "mock-user-1",
      participantName: "Alice",
      text: "Hey everyone, let's start discussing the new project features.",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      isComplete: true
    },
    {
      id: "mock-2",
      participantId: "mock-user-2",
      participantName: "Bob",
      text: "Great idea! I think we should focus on the user interface first.",
      timestamp: new Date(Date.now() - 250000), // 4 minutes ago
      isComplete: true
    },
    {
      id: "mock-3",
      participantId: "mock-user-3",
      participantName: "Charlie",
      text: "We also need to consider the backend architecture and database design.",
      timestamp: new Date(Date.now() - 200000), // 3 minutes ago
      isComplete: true
    }
  ]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Refs for media handling
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const discoveryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // WebRTC configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const results = Array.from(event.results);
        const latestResult = results[results.length - 1];
        
        if (latestResult && localParticipant) {
          const transcript: VoiceTranscript = {
            id: crypto.randomUUID(),
            participantId: localParticipant.id,
            participantName: localParticipant.name,
            text: latestResult[0].transcript,
            timestamp: new Date(),
            isComplete: latestResult.isFinal
          };
          
          setTranscripts(prev => {
            const existing = prev.find(t => t.participantId === localParticipant.id && !t.isComplete);
            if (existing && !latestResult.isFinal) {
              return prev.map(t => t.id === existing.id ? transcript : t);
            }
            return [...prev, transcript];
          });
        }
      };
    }
  }, [localParticipant]);

  // LocalStorage-based peer discovery
  const updatePeerList = (participant: VoiceParticipant) => {
    const peers = JSON.parse(localStorage.getItem('voice-peers') || '{}');
    peers[participant.id] = {
      ...participant,
      lastSeen: Date.now()
    };
    localStorage.setItem('voice-peers', JSON.stringify(peers));
  };

  const getPeerList = (): VoiceParticipant[] => {
    const peers = JSON.parse(localStorage.getItem('voice-peers') || '{}');
    const cutoff = Date.now() - 10000; // 10 seconds timeout
    
    return Object.values(peers).filter((peer: any) => peer.lastSeen > cutoff);
  };

  const removePeer = (participantId: string) => {
    const peers = JSON.parse(localStorage.getItem('voice-peers') || '{}');
    delete peers[participantId];
    localStorage.setItem('voice-peers', JSON.stringify(peers));
  };

  // Join voice room
  const joinRoom = async (roomId: string, userName: string) => {
    if (isConnecting || isConnected) return;
    
    setIsConnecting(true);
    
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      
      localStreamRef.current = stream;
      
      // Create local participant
      const participant: VoiceParticipant = {
        id: crypto.randomUUID(),
        name: userName,
        isMuted: false,
        isCurrentUser: true,
        audioLevel: 0,
        isConnected: true
      };
      
      setLocalParticipant(participant);
      setRoomId(roomId);
      
      // Add to peer list
      updatePeerList(participant);
      
      // Start peer discovery
      startPeerDiscovery();
      
      setIsConnected(true);
      setIsConnecting(false);
      
    } catch (error) {
      console.error('Error joining room:', error);
      setIsConnecting(false);
    }
  };

  // Start peer discovery process
  const startPeerDiscovery = () => {
    if (discoveryIntervalRef.current) return;
    
    discoveryIntervalRef.current = setInterval(() => {
      if (!localParticipant) return;
      
      // Update our presence
      updatePeerList(localParticipant);
      
      // Get current peer list
      const peers = getPeerList();
      const otherPeers = peers.filter(p => p.id !== localParticipant.id);
      
      // Update participants list
      setParticipants(otherPeers);
      
      // Create connections to new peers
      otherPeers.forEach(peer => {
        if (!peerConnectionsRef.current.has(peer.id)) {
          createPeerConnection(peer.id, peer.id > localParticipant.id);
        }
      });
      
      // Check for offers and answers in localStorage
      checkForSignalingMessages();
      
    }, 2000); // Check every 2 seconds
  };

  // Check for signaling messages in localStorage
  const checkForSignalingMessages = () => {
    if (!localParticipant) return;

    // Check for offers
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('offer-') && key.endsWith(`-${localParticipant.id}`)) {
        const fromId = key.split('-')[1];
        const offer = JSON.parse(localStorage.getItem(key) || '{}');
        handleOffer(fromId, offer);
        localStorage.removeItem(key);
      }
    });

    // Check for answers
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('answer-') && key.endsWith(`-${localParticipant.id}`)) {
        const fromId = key.split('-')[1];
        const answer = JSON.parse(localStorage.getItem(key) || '{}');
        handleAnswer(fromId, answer);
        localStorage.removeItem(key);
      }
    });

    // Check for ICE candidates
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('ice-') && key.endsWith(`-${localParticipant.id}`)) {
        const fromId = key.split('-')[1];
        const candidates = JSON.parse(localStorage.getItem(key) || '[]');
        candidates.forEach((candidate: RTCIceCandidateInit) => {
          handleIceCandidate(fromId, candidate);
        });
        localStorage.removeItem(key);
      }
    });
  };
  
  // Create peer connection
  const createPeerConnection = (participantId: string, isInitiator: boolean) => {
    const peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      // Handle remote audio playback
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.play();
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && localParticipant) {
        // Store ICE candidate in localStorage
        const key = `ice-${localParticipant.id}-${participantId}`;
        const candidates = JSON.parse(localStorage.getItem(key) || '[]');
        candidates.push(event.candidate);
        localStorage.setItem(key, JSON.stringify(candidates));
      }
    };
    
    peerConnectionsRef.current.set(participantId, {
      id: participantId,
      connection: peerConnection
    });
    
    // Create offer if initiator
    if (isInitiator) {
      createOffer(participantId);
    }
  };
  
  // Create offer
  const createOffer = async (participantId: string) => {
    const peerConnection = peerConnectionsRef.current.get(participantId)?.connection;
    if (!peerConnection || !localParticipant) return;
    
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Store offer in localStorage
      const key = `offer-${localParticipant.id}-${participantId}`;
      localStorage.setItem(key, JSON.stringify(offer));
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };
  
  // Handle offer
  const handleOffer = async (from: string, offer: RTCSessionDescriptionInit) => {
    let peerConnection = peerConnectionsRef.current.get(from)?.connection;
    
    if (!peerConnection) {
      createPeerConnection(from, false);
      peerConnection = peerConnectionsRef.current.get(from)?.connection;
    }
    
    if (!peerConnection || !localParticipant) return;
    
    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Store answer in localStorage
      const key = `answer-${localParticipant.id}-${from}`;
      localStorage.setItem(key, JSON.stringify(answer));
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };
  
  // Handle answer
  const handleAnswer = async (from: string, answer: RTCSessionDescriptionInit) => {
    const peerConnection = peerConnectionsRef.current.get(from)?.connection;
    if (!peerConnection) return;
    
    try {
      await peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };
  
  // Handle ICE candidate
  const handleIceCandidate = async (from: string, candidate: RTCIceCandidateInit) => {
    const peerConnection = peerConnectionsRef.current.get(from)?.connection;
    if (!peerConnection) return;
    
    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };
  
  // Close peer connection
  const closePeerConnection = (participantId: string) => {
    const peerConnection = peerConnectionsRef.current.get(participantId);
    if (peerConnection) {
      peerConnection.connection.close();
      peerConnectionsRef.current.delete(participantId);
    }
  };
  
  // Leave room
  const leaveRoom = () => {
    cleanup();
    setRoomId(null);
    setIsConnected(false);
    setParticipants([]);
    if (localParticipant) {
      removePeer(localParticipant.id);
    }
    setLocalParticipant(null);
  };
  
  // Cleanup function
  const cleanup = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close peer connections
    peerConnectionsRef.current.forEach((peer) => {
      peer.connection.close();
    });
    peerConnectionsRef.current.clear();
    
    // Stop discovery interval
    if (discoveryIntervalRef.current) {
      clearInterval(discoveryIntervalRef.current);
      discoveryIntervalRef.current = null;
    }
    
    // Stop transcription
    stopTranscription();
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };
  
  // Toggle deafen
  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
  };
  
  // Set volume
  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
  };
  
  // Start transcription
  const startTranscription = () => {
    if (recognitionRef.current && !isTranscribing) {
      recognitionRef.current.start();
      setIsTranscribing(true);
    }
  };
  
  // Stop transcription
  const stopTranscription = () => {
    if (recognitionRef.current && isTranscribing) {
      recognitionRef.current.stop();
      setIsTranscribing(false);
    }
  };
  
  // Clear transcripts
  const clearTranscripts = () => {
    setTranscripts([]);
  };
  
  // Mock audio level animation
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants(prev => prev.map(p => ({
        ...p,
        audioLevel: p.name === "Alice (Mock)" ? Math.random() * 0.8 : p.audioLevel
      })));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const value: VoiceContextType = {
    isConnected,
    isConnecting,
    roomId,
    isMuted,
    isDeafened,
    volume,
    participants,
    localParticipant,
    transcripts,
    isTranscribing,
    joinRoom,
    leaveRoom,
    toggleMute,
    toggleDeafen,
    setVolume,
    startTranscription,
    stopTranscription,
    clearTranscripts
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
}

// Global type declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}