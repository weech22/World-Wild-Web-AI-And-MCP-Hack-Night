import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface BackendContextType {
  socket: Socket | null;
  isSocketConnected: boolean;
  isApiAvailable: boolean;
  roomId: string;
  participantCount: number;
  participants: any[];
  joinRoom: (userName: string) => void;
  sendTranscript: (text: string, speakerId: string) => void;
  sendMessage: (content: string, senderName: string) => void;
  notes: any[];
  tasks: any[];
  messages: any[];
  apiStatus: 'checking' | 'available' | 'unavailable';
  processWithAI: () => Promise<any>;
  clearAllData: () => void;
  addDemoUser: (user: any) => void;
  addDemoTranscript: (transcript: any) => void;
  addDemoMessage: (message: any) => void;
  addDemoTask: (task: any) => void;
  addDemoNote: (note: any) => void;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export function BackendProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [roomId] = useState('hackathon-room');
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);

  // Fetch initial notes from backend
  const fetchInitialNotes = async () => {
    try {
      console.log('📝 Fetching initial notes from backend...');
      const response = await fetch('http://localhost:3001/api/notes', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        const initialNotes = await response.json();
        console.log('✅ Initial notes fetched:', initialNotes);
        setNotes(initialNotes);
      } else {
        console.log('❌ Failed to fetch initial notes:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching initial notes:', error);
    }
  };

  // Fetch initial tasks from backend
  const fetchInitialTasks = async () => {
    try {
      console.log('📋 Fetching initial tasks from backend...');
      const response = await fetch('http://localhost:3001/api/tasks', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        const initialTasks = await response.json();
        console.log('✅ Initial tasks fetched:', initialTasks);
        setTasks(initialTasks);
      } else {
        console.log('❌ Failed to fetch initial tasks:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching initial tasks:', error);
    }
  };

  // Fetch initial messages from backend
  const fetchInitialMessages = async () => {
    try {
      console.log('💬 Fetching initial messages from backend...');
      const response = await fetch(`http://localhost:3001/api/messages?room_id=${roomId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        const initialMessages = await response.json();
        console.log('✅ Initial messages fetched:', initialMessages);
        setMessages(initialMessages);
      } else {
        console.log('❌ Failed to fetch initial messages:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching initial messages:', error);
    }
  };

  // AI processing function
  const processWithAI = async () => {
    try {
      console.log('🤖 Starting AI processing...');
      const response = await fetch('http://localhost:3001/api/ai-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ AI processing completed:', result);
        return result;
      } else {
        console.error('❌ AI processing failed:', response.status);
        throw new Error(`AI processing failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error processing with AI:', error);
      throw error;
    }
  };

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
        
        // Fetch initial data when API becomes available
        await fetchInitialNotes();
        await fetchInitialTasks();
        await fetchInitialMessages();
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
    
    // Check API health periodically - DISABLED to prevent focus loss
    // const healthCheckInterval = setInterval(checkApiHealth, 120000); // Every 2 minutes (reduced from 30 seconds to prevent focus loss)

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
        // Fetch initial data when socket connects
        fetchInitialNotes();
        fetchInitialTasks();
        fetchInitialMessages();
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
        setParticipants(data.participants || []);
      });

      newSocket.on('participant-joined', (data) => {
        console.log('Participant joined:', data);
        setParticipantCount(data.participantCount);
        // Add the new participant to the list
        if (data.newParticipant) {
          setParticipants(prev => [...prev, data.newParticipant]);
        }
      });

      newSocket.on('participant-left', (data) => {
        console.log('Participant left:', data);
        setParticipantCount(data.participantCount);
        // Remove the participant from the list
        if (data.leftParticipant) {
          setParticipants(prev => prev.filter(p => p.id !== data.leftParticipant.id));
        }
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

      newSocket.on('messages_updated', (updatedMessages) => {
        console.log('Messages updated:', updatedMessages);
        setMessages(updatedMessages);
      });

      newSocket.on('message_received', (message) => {
        console.log('Message received:', message);
        setMessages(prev => [...prev, message]);
      });
    }

    return () => {
      // clearInterval(healthCheckInterval); // Disabled
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

  const sendMessage = async (content: string, senderName: string) => {
    try {
      // Send message to backend database
      const response = await fetch('http://localhost:3001/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          sender_id: crypto.randomUUID(),
          sender_name: senderName,
          room_id: roomId
        })
      });
      
      if (response.ok) {
        const message = await response.json();
        console.log('✅ Message sent to database:', message);
      } else {
        console.error('❌ Failed to send message:', response.status);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  const clearAllData = () => {
    setNotes([]);
    setTasks([]);
    setMessages([]);
    setParticipants([]);
    setParticipantCount(0);
  };

  const addDemoUser = (user: any) => {
    setParticipants(prev => {
      // Check if user already exists to avoid duplicates
      const existingUser = prev.find(p => p.id === user.id);
      if (existingUser) {
        console.log(`⚠️ User ${user.name} already exists, skipping`);
        return prev;
      }
      console.log(`👤 Adding new user: ${user.name}`);
      return [...prev, user];
    });
    setParticipantCount(prev => prev + 1);
  };

  const addDemoTranscript = (transcript: any) => {
    // For demo purposes, we'll add transcripts to messages or handle them separately
    console.log('Demo transcript:', transcript);
  };

  const addDemoMessage = (message: any) => {
    setMessages(prev => [...prev, message]);
  };

  const addDemoTask = (task: any) => {
    setTasks(prev => [...prev, task]);
  };

  const addDemoNote = (note: any) => {
    setNotes(prev => [...prev, note]);
  };

  const value: BackendContextType = {
    socket,
    isSocketConnected,
    isApiAvailable,
    roomId,
    participantCount,
    participants,
    joinRoom,
    sendTranscript,
    sendMessage,
    notes,
    tasks,
    messages,
    apiStatus,
    processWithAI,
    clearAllData,
    addDemoUser,
    addDemoTranscript,
    addDemoMessage,
    addDemoTask,
    addDemoNote,
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