import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { useBackend } from "@/providers/BackendProvider";
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
  // Get backend context
  const { joinRoom: joinBackendRoom, sendTranscript, participantCount, isConnected: isBackendConnected } = useBackend();
  
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

  // Update participants count based on backend
  useEffect(() => {
    if (isBackendConnected && participantCount > 0) {
      // Generate mock participants based on backend count
      const mockParticipants = Array.from({ length: participantCount - 1 }, (_, i) => ({
        id: `participant-${i + 1}`,
        name: `User ${i + 1}`,
        isMuted: Math.random() > 0.5,
        isCurrentUser: false,
        audioLevel: Math.random() * 0.5,
        isConnected: true
      }));
      setParticipants(mockParticipants);
    }
  }, [participantCount, isBackendConnected]);
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
      
      recognitionRef.current.onresult = async (event) => {
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
          
          // Update local state
          setTranscripts(prev => {
            const existing = prev.find(t => t.participantId === localParticipant.id && !t.isComplete);
            if (existing && !latestResult.isFinal) {
              return prev.map(t => t.id === existing.id ? transcript : t);
            }
            return [...prev, transcript];
          });
          
          // Send transcript to backend
          if (latestResult.isFinal && isBackendConnected) {
            try {
              sendTranscript(latestResult[0].transcript, localParticipant.name);
            } catch (error) {
              console.error('Failed to send transcript:', error);
            }
          }
        }
      };
    }
  }, [localParticipant]);

  // Server-based peer discovery
  const updatePeerList = async (participant: VoiceParticipant) => {
    try {
      await fetch('/api/voice/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: participant.id })
      });
    } catch (error) {
      console.error('Failed to update peer list:', error);
    }
  };

  const getPeerList = async (): Promise<VoiceParticipant[]> => {
    try {
      const response = await fetch('/api/voice/peers');
      if (response.ok) {
        const peers = await response.json();
        return peers.filter((peer: any) => peer.id !== localParticipant?.id);
      }
    } catch (error) {
      console.error('Failed to get peer list:', error);
    }
    return [];
  };

  const removePeer = async (participantId: string) => {
    try {
      await fetch('/api/voice/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId })
      });
    } catch (error) {
      console.error('Failed to remove peer:', error);
    }
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
      
      // Join room on backend
      if (isBackendConnected) {
        joinBackendRoom(userName);
      }
      
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
    
    discoveryIntervalRef.current = setInterval(async () => {
      if (!localParticipant) return;
      
      // Update our presence
      await updatePeerList(localParticipant);
      
      // Get current peer list
      const peers = await getPeerList();
      
      // Update participants list
      setParticipants(peers);
      
      // Create connections to new peers
      peers.forEach(peer => {
        if (!peerConnectionsRef.current.has(peer.id)) {
          createPeerConnection(peer.id, peer.id > localParticipant.id);
        }
      });
      
      // Check for offers and answers from server
      await checkForSignalingMessages();
      
      // Fetch shared transcripts from server
      await fetchSharedTranscripts();
      
    }, 2000); // Check every 2 seconds
  };

  // Check for signaling messages from server
  const checkForSignalingMessages = async () => {
    if (!localParticipant) return;

    try {
      const response = await fetch(`/api/voice/signaling/${localParticipant.id}`);
      if (response.ok) {
        const signaling = await response.json();
        
        // Handle offers
        signaling.offers?.forEach((item: any) => {
          handleOffer(item.from, item.offer);
        });
        
        // Handle answers
        signaling.answers?.forEach((item: any) => {
          handleAnswer(item.from, item.answer);
        });
        
        // Handle ICE candidates
        signaling.candidates?.forEach((item: any) => {
          handleIceCandidate(item.from, item.candidate);
        });
      }
    } catch (error) {
      console.error('Failed to check signaling messages:', error);
    }
  };

  // Fetch shared transcripts from server
  const fetchSharedTranscripts = async () => {
    try {
      const response = await fetch('/api/voice/transcripts');
      if (response.ok) {
        const serverTranscripts = await response.json();
        
        // Convert server timestamps back to Date objects
        const processedTranscripts = serverTranscripts.map((transcript: any) => ({
          ...transcript,
          timestamp: new Date(transcript.timestamp)
        }));
        
        // Merge with local transcripts, avoiding duplicates
        setTranscripts(prev => {
          const combined = [...prev];
          
          processedTranscripts.forEach((serverTranscript: any) => {
            const exists = combined.find(t => 
              t.participantId === serverTranscript.participantId && 
              t.text === serverTranscript.text &&
              t.isComplete === serverTranscript.isComplete
            );
            
            if (!exists) {
              combined.push(serverTranscript);
            }
          });
          
          // Sort by timestamp
          return combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        });
      }
    } catch (error) {
      console.error('Failed to fetch shared transcripts:', error);
    }
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
    peerConnection.onicecandidate = async (event) => {
      if (event.candidate && localParticipant) {
        // Send ICE candidate to server
        try {
          await fetch('/api/voice/ice-candidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: localParticipant.id,
              to: participantId,
              candidate: event.candidate
            })
          });
        } catch (error) {
          console.error('Failed to send ICE candidate:', error);
        }
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
      
      // Send offer to server
      await fetch('/api/voice/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: localParticipant.id,
          to: participantId,
          offer: offer
        })
      });
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
      
      // Send answer to server
      await fetch('/api/voice/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: localParticipant.id,
          to: from,
          answer: answer
        })
      });
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
  const leaveRoom = async () => {
    if (localParticipant) {
      await removePeer(localParticipant.id);
    }
    cleanup();
    setRoomId(null);
    setIsConnected(false);
    setParticipants([]);
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