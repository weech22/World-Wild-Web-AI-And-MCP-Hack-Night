import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface BackendContextType {
  socket: Socket | null;
  isSocketConnected: boolean;
  isApiAvailable: boolean;
  roomId: string;
  participantCount: number;
  joinRoom: (userName: string) => void;
  sendTranscript: (text: string, speakerId: string) => void;
  notes: any[];
  tasks: any[];
  apiStatus: 'checking' | 'available' | 'unavailable';
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export function BackendProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [roomId] = useState('hackathon-room');
  const [participantCount, setParticipantCount] = useState(0);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Check API health independently of Socket.IO
  const checkApiHealth = async () => {
    try {
      console.log('🔍 Checking API health at http://localhost:3001/api/health...');
      setApiStatus('checking');
      const response = await fetch('http://localhost:3001/api/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 5000, // 5 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsApiAvailable(true);
        setApiStatus('available');
        console.log('✅ API health check: available', data);
      } else {
        setIsApiAvailable(false);
        setApiStatus('unavailable');
        console.log('❌ API health check: unavailable (bad response)', response.status, response.statusText);
      }
    } catch (error) {
      setIsApiAvailable(false);
      setApiStatus('unavailable');
      console.log('❌ API health check: unavailable (error)', error.message);
    }
  };

  useEffect(() => {
    // Check API health first
    checkApiHealth();
    
    // Check API health periodically
    const healthCheckInterval = setInterval(checkApiHealth, 30000); // Every 30 seconds

    // Attempt Socket.IO connection with error handling
    let newSocket: Socket | null = null;
    
    try {
      newSocket = io('http://localhost:3001', {
        timeout: 5000,
        retries: 3,
        autoConnect: true,
      });
      
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket.IO: Connected to backend');
        setIsSocketConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket.IO: Disconnected from backend:', reason);
        setIsSocketConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.log('Socket.IO: Connection error:', error.message);
        setIsSocketConnected(false);
      });
    } catch (error) {
      console.error('Socket.IO: Failed to initialize:', error);
      setIsSocketConnected(false);
    }

    // Only set up Socket.IO event handlers if socket was created successfully
    if (newSocket) {
      newSocket.on('room-joined', (data) => {
        console.log('Room joined:', data);
        setParticipantCount(data.participantCount);
      });

      newSocket.on('participant-joined', (data) => {
        console.log('Participant joined:', data);
        setParticipantCount(data.participantCount);
      });

      newSocket.on('participant-left', (data) => {
        console.log('Participant left:', data);
        setParticipantCount(data.participantCount);
      });

      newSocket.on('room-full', () => {
        console.log('Room is full');
        alert('Room is full! Maximum 5 participants allowed.');
      });

      newSocket.on('notes_updated', (updatedNotes) => {
        console.log('Notes updated:', updatedNotes);
        setNotes(updatedNotes);
      });

      newSocket.on('tasks_updated', (updatedTasks) => {
        console.log('Tasks updated:', updatedTasks);
        setTasks(updatedTasks);
      });
    }

    return () => {
      clearInterval(healthCheckInterval);
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  const joinRoom = (userName: string) => {
    if (socket && isSocketConnected) {
      socket.emit('join-room', { roomId, userName });
    }
  };

  const sendTranscript = (text: string, speakerId: string) => {
    if (socket && isSocketConnected) {
      socket.emit('transcript_chunk', { roomId, text, speakerId });
    }
  };

  const value: BackendContextType = {
    socket,
    isSocketConnected,
    isApiAvailable,
    roomId,
    participantCount,
    joinRoom,
    sendTranscript,
    notes,
    tasks,
    apiStatus,
  };

  return (
    <BackendContext.Provider value={value}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error("useBackend must be used within a BackendProvider");
  }
  return context;
}