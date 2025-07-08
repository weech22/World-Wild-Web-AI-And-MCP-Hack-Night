import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface BackendContextType {
  socket: Socket | null;
  isConnected: boolean;
  roomId: string;
  participantCount: number;
  joinRoom: (userName: string) => void;
  sendTranscript: (text: string, speakerId: string) => void;
  notes: any[];
  tasks: any[];
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export function BackendProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId] = useState('hackathon-room');
  const [participantCount, setParticipantCount] = useState(0);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    // Connect to backend
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to backend');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from backend');
      setIsConnected(false);
    });

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

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = (userName: string) => {
    if (socket) {
      socket.emit('join-room', { roomId, userName });
    }
  };

  const sendTranscript = (text: string, speakerId: string) => {
    if (socket && isConnected) {
      socket.emit('transcript_chunk', { roomId, text, speakerId });
    }
  };

  const value: BackendContextType = {
    socket,
    isConnected,
    roomId,
    participantCount,
    joinRoom,
    sendTranscript,
    notes,
    tasks,
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