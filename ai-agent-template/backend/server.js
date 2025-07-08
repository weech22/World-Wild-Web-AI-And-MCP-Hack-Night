import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import knex from 'knex';
import { SYSTEM_PROMPT } from '../constants.ts';
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

// Database setup
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: './dev.sqlite3'
  },
  useNullAsDefault: true
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database tables
async function initDatabase() {
  // Create notes table
  const notesExists = await db.schema.hasTable('notes');
  if (!notesExists) {
    await db.schema.createTable('notes', (table) => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.text('content');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Create tasks table
  const tasksExists = await db.schema.hasTable('tasks');
  if (!tasksExists) {
    await db.schema.createTable('tasks', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('details');
      table.string('assignee');
      table.boolean('is_done').defaultTo(false);
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Create messages table
  const messagesExists = await db.schema.hasTable('messages');
  if (!messagesExists) {
    await db.schema.createTable('messages', (table) => {
      table.increments('id').primary();
      table.text('content').notNullable();
      table.string('sender_id').notNullable();
      table.string('sender_name').notNullable();
      table.string('room_id').notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  }
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
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await db('notes').select('*').orderBy('created_at', 'desc');
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { title, content } = req.body;
    const [id] = await db('notes').insert({ title, content });
    const note = await db('notes').where('id', id).first();
    
    // Broadcast to all clients
    io.emit('notes_updated', await db('notes').select('*').orderBy('created_at', 'desc'));
    
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await db('notes').where('id', id).update(updates);
    const note = await db('notes').where('id', id).first();
    
    // Broadcast to all clients
    io.emit('notes_updated', await db('notes').select('*').orderBy('created_at', 'desc'));
    
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db('notes').where('id', id).delete();
    
    // Broadcast to all clients
    io.emit('notes_updated', await db('notes').select('*').orderBy('created_at', 'desc'));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes - Tasks CRUD
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await db('tasks').select('*').orderBy('created_at', 'desc');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { name, details, assignee } = req.body;
    const [id] = await db('tasks').insert({ name, details, assignee });
    const task = await db('tasks').where('id', id).first();
    
    // Broadcast to all clients
    io.emit('tasks_updated', await db('tasks').select('*').orderBy('created_at', 'desc'));
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    await db('tasks').where('id', id).update(updates);
    const task = await db('tasks').where('id', id).first();
    
    // Broadcast to all clients
    io.emit('tasks_updated', await db('tasks').select('*').orderBy('created_at', 'desc'));
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db('tasks').where('id', id).delete();
    
    // Broadcast to all clients
    io.emit('tasks_updated', await db('tasks').select('*').orderBy('created_at', 'desc'));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes - Messages CRUD
app.get('/api/messages', async (req, res) => {
  try {
    const { room_id } = req.query;
    let query = db('messages').select('*').orderBy('created_at', 'asc');
    
    if (room_id) {
      query = query.where('room_id', room_id);
    }
    
    const messages = await query;
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { content, sender_id, sender_name, room_id } = req.body;
    const [id] = await db('messages').insert({ content, sender_id, sender_name, room_id });
    const message = await db('messages').where('id', id).first();
    
    // Broadcast to room
    io.to(room_id).emit('message_received', message);
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const message = await db('messages').where('id', id).first();
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    await db('messages').where('id', id).delete();
    
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
    room.participants.set(socket.id, { userName, joinedAt: new Date() });
    socket.join(roomId);
    
    // Send current state to the new participant
    socket.emit('room-joined', {
      participantCount: room.participants.size,
      participants: Array.from(room.participants.values())
    });
    
    // Broadcast to room about new participant
    socket.to(roomId).emit('participant-joined', {
      participantCount: room.participants.size,
      newParticipant: { userName, joinedAt: new Date() }
    });
    
    // Send current notes and tasks
    db('notes').select('*').orderBy('created_at', 'desc').then(notes => {
      socket.emit('notes_updated', notes);
    });
    
    db('tasks').select('*').orderBy('created_at', 'desc').then(tasks => {
      socket.emit('tasks_updated', tasks);
    });
    
    // Send current messages for the room
    db('messages').select('*').where('room_id', roomId).orderBy('created_at', 'asc').then(messages => {
      socket.emit('messages_updated', messages);
    });
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
        room.participants.delete(socket.id);
        socket.to(roomId).emit('participant-left', {
          participantCount: room.participants.size
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
    
    // Get chat messages for the room
    const messages = await db('messages').select('*').where('room_id', roomId).orderBy('created_at', 'asc');
    
    // Get voice transcripts if available
    const room = rooms.get(roomId);
    const transcripts = room?.transcript || '';
    
    // Combine messages and transcripts
    const chatHistory = messages.map(msg => `${msg.sender_name}: ${msg.content}`).join('\n');
    const fullConversation = `CHAT MESSAGES:\n${chatHistory}\n\nVOICE TRANSCRIPTS:\n${transcripts}`;
    
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
    
    // Create tasks from AI extraction
    if (result.object.tasks) {
      for (const task of result.object.tasks) {
        await db('tasks').insert(task);
      }
      io.emit('tasks_updated', await db('tasks').select('*').orderBy('created_at', 'desc'));
    }
    
    // Create notes from AI extraction
    if (result.object.notes) {
      for (const note of result.object.notes) {
        await db('notes').insert(note);
      }
      io.emit('notes_updated', await db('notes').select('*').orderBy('created_at', 'desc'));
    }
    
    // Clear processed transcript
    if (room) {
      room.transcript = '';
    }
    
    res.json({ 
      success: true, 
      tasksCreated: result.object.tasks?.length || 0,
      notesCreated: result.object.notes?.length || 0
    });
    
  } catch (error) {
    console.error('AI processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process transcript with AI
async function processTranscriptWithAI(roomId, transcript) {
  try {
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
        await db('tasks').insert(task);
      }
      io.emit('tasks_updated', await db('tasks').select('*').orderBy('created_at', 'desc'));
    }
    
    // Create notes from AI extraction
    if (result.object.notes) {
      for (const note of result.object.notes) {
        await db('notes').insert(note);
      }
      io.emit('notes_updated', await db('notes').select('*').orderBy('created_at', 'desc'));
    }
    
    // Clear processed transcript
    rooms.get(roomId).transcript = '';
    
  } catch (error) {
    console.error('AI processing error:', error);
  }
}

// Start server
const PORT = process.env.PORT || 3001;

initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
});