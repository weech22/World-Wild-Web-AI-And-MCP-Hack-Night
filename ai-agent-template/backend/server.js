import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
// import knex from 'knex';
import { SYSTEM_PROMPT } from './constants.js';
import { google } from '@ai-sdk/google';
import { generateId, generateObject } from 'ai';
import { z } from 'zod';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory database for now (simplified)
let notes = [];
let tasks = [];
let messages = [];
let transcripts = [];
let aiExtractions = [];
let nextNoteId = 1;
let nextTaskId = 1;
let nextMessageId = 1;
let nextTranscriptId = 1;
let nextExtractionId = 1;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize in-memory data (no database setup needed)
function initDatabase() {
  console.log('Using in-memory storage for development');
  // Add some sample data
  notes.push({
    id: nextNoteId++,
    title: 'Welcome Note',
    content: 'This is a sample note created by the backend.',
    created_at: new Date().toISOString()
  });
  
  tasks.push({
    id: nextTaskId++,
    name: 'Sample Task',
    details: 'This is a sample task created by the backend.',
    assignee: 'System',
    is_done: false,
    created_at: new Date().toISOString()
  });
}

// Room management
const rooms = new Map();
const MAX_PARTICIPANTS = 5;

// AI Model setup
const model = google('gemini-2.5-pro');

// MCP Tool definitions for Gemini
const noteTools = {
  create_note: {
    description: 'Create a new note',
    parameters: z.object({
      title: z.string().describe('The title of the note'),
      content: z.string().describe('The content of the note')
    })
  },
  update_note: {
    description: 'Update an existing note',
    parameters: z.object({
      id: z.number().describe('The ID of the note to update'),
      title: z.string().optional().describe('The new title'),
      content: z.string().optional().describe('The new content')
    })
  },
  delete_note: {
    description: 'Delete a note',
    parameters: z.object({
      id: z.number().describe('The ID of the note to delete')
    })
  }
};

const taskTools = {
  create_task: {
    description: 'Create a new task',
    parameters: z.object({
      name: z.string().describe('The name of the task'),
      details: z.string().optional().describe('Additional details about the task'),
      assignee: z.string().optional().describe('Person assigned to the task')
    })
  },
  update_task: {
    description: 'Update an existing task',
    parameters: z.object({
      id: z.number().describe('The ID of the task to update'),
      name: z.string().optional().describe('The new name'),
      details: z.string().optional().describe('The new details'),
      assignee: z.string().optional().describe('The new assignee'),
      is_done: z.boolean().optional().describe('Whether the task is completed')
    })
  },
  delete_task: {
    description: 'Delete a task',
    parameters: z.object({
      id: z.number().describe('The ID of the task to delete')
    })
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes - Notes CRUD
app.get('/api/notes', (req, res) => {
  try {
    const sortedNotes = notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(sortedNotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notes', (req, res) => {
  try {
    const { title, content } = req.body;
    const note = {
      id: nextNoteId++,
      title,
      content,
      created_at: new Date().toISOString()
    };
    notes.push(note);
    
    // Broadcast to all clients
    const sortedNotes = notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    io.emit('notes_updated', sortedNotes);
    
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const noteIndex = notes.findIndex(n => n.id == id);
    
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    notes[noteIndex] = { ...notes[noteIndex], ...updates };
    
    // Broadcast to all clients
    const sortedNotes = notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    io.emit('notes_updated', sortedNotes);
    
    res.json(notes[noteIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const noteIndex = notes.findIndex(n => n.id == id);
    
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    notes.splice(noteIndex, 1);
    
    // Broadcast to all clients
    const sortedNotes = notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    io.emit('notes_updated', sortedNotes);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes - Tasks CRUD
app.get('/api/tasks', (req, res) => {
  try {
    const sortedTasks = tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(sortedTasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { name, details, assignee } = req.body;
    const task = {
      id: nextTaskId++,
      name,
      details,
      assignee,
      is_done: false,
      created_at: new Date().toISOString()
    };
    tasks.push(task);
    
    // Broadcast to all clients
    const sortedTasks = tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    io.emit('tasks_updated', sortedTasks);
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const taskIndex = tasks.findIndex(t => t.id == id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    
    // Broadcast to all clients
    const sortedTasks = tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    io.emit('tasks_updated', sortedTasks);
    
    res.json(tasks[taskIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const taskIndex = tasks.findIndex(t => t.id == id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    tasks.splice(taskIndex, 1);
    
    // Broadcast to all clients
    const sortedTasks = tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    io.emit('tasks_updated', sortedTasks);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes - Transcripts CRUD
app.get('/api/transcripts', (req, res) => {
  try {
    const { room_id } = req.query;
    let filteredTranscripts = transcripts;
    
    if (room_id) {
      filteredTranscripts = transcripts.filter(t => t.room_id === room_id);
    }
    
    const sortedTranscripts = filteredTranscripts.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    res.json(sortedTranscripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/transcripts', (req, res) => {
  try {
    const { content, speaker_id, speaker_name, room_id, is_final } = req.body;
    const transcript = {
      id: nextTranscriptId++,
      content,
      speaker_id,
      speaker_name,
      room_id,
      is_final: is_final || false,
      created_at: new Date().toISOString()
    };
    transcripts.push(transcript);
    
    // Broadcast to room
    io.to(room_id).emit('transcript_received', transcript);
    
    res.json(transcript);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/transcripts/:id', (req, res) => {
  try {
    const { id } = req.params;
    const transcriptIndex = transcripts.findIndex(t => t.id == id);
    
    if (transcriptIndex === -1) {
      return res.status(404).json({ error: 'Transcript not found' });
    }
    
    const transcript = transcripts[transcriptIndex];
    transcripts.splice(transcriptIndex, 1);
    
    // Broadcast to room
    io.to(transcript.room_id).emit('transcript_deleted', { id });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes - Messages CRUD
app.get('/api/messages', (req, res) => {
  try {
    const { room_id } = req.query;
    let filteredMessages = messages;
    
    if (room_id) {
      filteredMessages = messages.filter(m => m.room_id === room_id);
    }
    
    const sortedMessages = filteredMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    res.json(sortedMessages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages', (req, res) => {
  try {
    const { content, sender_id, sender_name, room_id } = req.body;
    const message = {
      id: nextMessageId++,
      content,
      sender_id,
      sender_name,
      room_id,
      created_at: new Date().toISOString()
    };
    messages.push(message);
    
    // Broadcast to room
    io.to(room_id).emit('message_received', message);
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/messages/:id', (req, res) => {
  try {
    const { id } = req.params;
    const messageIndex = messages.findIndex(m => m.id == id);
    
    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    const message = messages[messageIndex];
    messages.splice(messageIndex, 1);
    
    // Broadcast to room
    io.to(message.room_id).emit('message_deleted', { id });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join room
  socket.on('join-room', ({ roomId, userName }) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { participants: new Map(), transcript: '' });
    }
    
    const room = rooms.get(roomId);
    
    // Check participant limit
    if (room.participants.size >= MAX_PARTICIPANTS) {
      socket.emit('room-full');
      return;
    }
    
    // Add participant
    room.participants.set(socket.id, { id: socket.id, userName, joinedAt: new Date() });
    socket.join(roomId);
    
    // Send current state to the new participant
    socket.emit('room-joined', {
      participantCount: room.participants.size,
      participants: Array.from(room.participants.values())
    });
    
    // Broadcast to room about new participant
    socket.to(roomId).emit('participant-joined', {
      participantCount: room.participants.size,
      newParticipant: { id: socket.id, userName, joinedAt: new Date() }
    });
    
    // Send current notes and tasks
    const sortedNotes = notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    socket.emit('notes_updated', sortedNotes);
    
    const sortedTasks = tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    socket.emit('tasks_updated', sortedTasks);
    
    // Send current messages for the room
    const roomMessages = messages.filter(m => m.room_id === roomId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    socket.emit('messages_updated', roomMessages);
  });
  
  // Handle transcript chunks
  socket.on('transcript_chunk', async ({ roomId, text, speakerId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    // Accumulate transcript
    room.transcript += `${speakerId}: ${text}\n`;
    
    // Process with AI every few chunks or when transcript is substantial
    if (room.transcript.length > 200) {
      await processTranscriptWithAI(roomId, room.transcript);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from all rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.participants.has(socket.id)) {
        const participant = room.participants.get(socket.id);
        room.participants.delete(socket.id);
        socket.to(roomId).emit('participant-left', {
          participantCount: room.participants.size,
          leftParticipant: participant
        });
        
        // Clean up empty rooms
        if (room.participants.size === 0) {
          rooms.delete(roomId);
        }
      }
    }
  });
});

// AI processing endpoint
app.post('/api/ai-process', async (req, res) => {
  try {
    const { roomId } = req.body;
    
    console.log('🤖 AI processing started for room:', roomId);
    
    // Get chat messages for the room
    const roomMessages = messages.filter(m => m.room_id === roomId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Get voice transcripts for the room
    const roomTranscripts = transcripts.filter(t => t.room_id === roomId && t.is_final)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Combine messages and transcripts
    const chatHistory = roomMessages.map(msg => `${msg.sender_name}: ${msg.content}`).join('\n');
    const transcriptHistory = roomTranscripts.map(t => `${t.speaker_name}: ${t.content}`).join('\n');
    
    const fullConversation = `CHAT MESSAGES:\n${chatHistory}\n\nVOICE TRANSCRIPTS:\n${transcriptHistory}`;
    
    console.log('📊 Processing data:', {
      messagesCount: roomMessages.length,
      transcriptsCount: roomTranscripts.length,
      totalLength: fullConversation.length
    });
    
    if (fullConversation.trim().length === 0) {
      return res.json({ 
        success: false, 
        error: 'No messages or transcripts found to process',
        tasksCreated: 0,
        notesCreated: 0
      });
    }
    
    const result = await generateObject({
      model,
      system: SYSTEM_PROMPT,
      prompt: `Process this conversation and extract actionable items:\n\n${fullConversation}`,
      schema: z.object({
        tasks: z.array(z.object({
          name: z.string(),
          details: z.string().optional(),
          assignee: z.string().optional()
        })).optional(),
        notes: z.array(z.object({
          title: z.string(),
          content: z.string()
        })).optional()
      })
    });
    
    console.log('🧠 AI extraction result:', result.object);
    
    // Create tasks from AI extraction
    const createdTasks = [];
    if (result.object.tasks) {
      for (const task of result.object.tasks) {
        const newTask = {
          id: nextTaskId++,
          name: task.name,
          details: task.details || '',
          assignee: task.assignee || '',
          is_done: false,
          created_at: new Date().toISOString()
        };
        tasks.push(newTask);
        createdTasks.push(newTask);
      }
      const sortedTasks = tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      io.emit('tasks_updated', sortedTasks);
    }
    
    // Create notes from AI extraction
    const createdNotes = [];
    if (result.object.notes) {
      for (const note of result.object.notes) {
        const newNote = {
          id: nextNoteId++,
          title: note.title,
          content: note.content,
          created_at: new Date().toISOString()
        };
        notes.push(newNote);
        createdNotes.push(newNote);
      }
      const sortedNotes = notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      io.emit('notes_updated', sortedNotes);
    }
    
    // Store AI extraction record
    const extraction = {
      id: nextExtractionId++,
      room_id: roomId,
      messages_processed: roomMessages.length,
      transcripts_processed: roomTranscripts.length,
      tasks_created: createdTasks.length,
      notes_created: createdNotes.length,
      extraction_data: result.object,
      created_at: new Date().toISOString()
    };
    aiExtractions.push(extraction);
    
    console.log('✅ AI processing completed:', {
      tasksCreated: createdTasks.length,
      notesCreated: createdNotes.length
    });
    
    res.json({ 
      success: true, 
      tasksCreated: createdTasks.length,
      notesCreated: createdNotes.length,
      messagesProcessed: roomMessages.length,
      transcriptsProcessed: roomTranscripts.length,
      extraction
    });
    
  } catch (error) {
    console.error('❌ AI processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process transcript with AI (legacy function - now uses main AI processing)
async function processTranscriptWithAI(roomId, transcript) {
  try {
    console.log('📝 Processing transcript with AI for room:', roomId);
    
    // This is now handled by the main AI processing endpoint
    // which processes both messages and transcripts together
    // This function is kept for backward compatibility
    
    const result = await generateObject({
      model,
      system: SYSTEM_PROMPT,
      prompt: `Process this conversation transcript and extract actionable items:\n\n${transcript}`,
      schema: z.object({
        tasks: z.array(z.object({
          name: z.string(),
          details: z.string().optional(),
          assignee: z.string().optional()
        })).optional(),
        notes: z.array(z.object({
          title: z.string(),
          content: z.string()
        })).optional()
      })
    });
    
    // Create tasks from AI extraction
    if (result.object.tasks) {
      for (const task of result.object.tasks) {
        const newTask = {
          id: nextTaskId++,
          name: task.name,
          details: task.details || '',
          assignee: task.assignee || '',
          is_done: false,
          created_at: new Date().toISOString()
        };
        tasks.push(newTask);
      }
      const sortedTasks = tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      io.emit('tasks_updated', sortedTasks);
    }
    
    // Create notes from AI extraction
    if (result.object.notes) {
      for (const note of result.object.notes) {
        const newNote = {
          id: nextNoteId++,
          title: note.title,
          content: note.content,
          created_at: new Date().toISOString()
        };
        notes.push(newNote);
      }
      const sortedNotes = notes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      io.emit('notes_updated', sortedNotes);
    }
    
    // Clear processed transcript
    const room = rooms.get(roomId);
    if (room) {
      room.transcript = '';
    }
    
  } catch (error) {
    console.error('AI processing error:', error);
  }
}

// Start server
const PORT = process.env.PORT || 3001;

initDatabase();
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});