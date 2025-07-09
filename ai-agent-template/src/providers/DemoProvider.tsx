import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

export interface DemoUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

export interface DemoTranscript {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
}

export interface DemoMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
}

export interface DemoTask {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Date;
}

export interface DemoNote {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'note' | 'link';
}

export type DemoPhase = 'waiting' | 'users_joining' | 'voice_chat' | 'text_chat' | 'ai_processing' | 'creating_tasks' | 'completed';

interface DemoState {
  isActive: boolean;
  phase: DemoPhase;
  timeElapsed: number;
  users: DemoUser[];
  transcripts: DemoTranscript[];
  messages: DemoMessage[];
  tasks: DemoTask[];
  notes: DemoNote[];
  currentUserIndex: number;
  currentTranscriptIndex: number;
  currentMessageIndex: number;
  currentTaskIndex: number;
  currentNoteIndex: number;
}

type DemoAction = 
  | { type: 'START_DEMO' }
  | { type: 'NEXT_PHASE' }
  | { type: 'UPDATE_TIME'; payload: number }
  | { type: 'ADD_USER'; payload: DemoUser }
  | { type: 'ADD_TRANSCRIPT'; payload: DemoTranscript }
  | { type: 'ADD_MESSAGE'; payload: DemoMessage }
  | { type: 'ADD_TASK'; payload: DemoTask }
  | { type: 'ADD_NOTE'; payload: DemoNote }
  | { type: 'RESET' };

const demoUsers: DemoUser[] = [
  { id: '1', name: 'Jim', avatar: '👨‍💻', color: '#3B82F6' },
  { id: '2', name: 'Tim', avatar: '👨‍💼', color: '#10B981' },
  { id: '3', name: 'Kim', avatar: '👩‍🎨', color: '#F59E0B' }
];

const demoTranscripts: DemoTranscript[] = [
  { id: '1', userId: '1', userName: 'Jim', text: 'Hey team! I\'ve been thinking about our upcoming product launch. We need to start organizing everything.', timestamp: new Date() },
  { id: '2', userId: '2', userName: 'Tim', text: 'Absolutely! I\'ve been working on the marketing materials. We should coordinate with development.', timestamp: new Date() },
  { id: '3', userId: '3', userName: 'Kim', text: 'Great timing! I just finished the design mockups. We need to plan the user onboarding flow.', timestamp: new Date() },
  { id: '4', userId: '1', userName: 'Jim', text: 'Perfect! We also need to set up analytics tracking and prepare documentation.', timestamp: new Date() },
  { id: '5', userId: '2', userName: 'Tim', text: 'I can handle the analytics setup. Should we create a timeline for all these tasks?', timestamp: new Date() },
  { id: '6', userId: '3', userName: 'Kim', text: 'Yes! And we need to coordinate testing phases and feedback collection.', timestamp: new Date() }
];

const demoMessages: DemoMessage[] = [
  { id: '1', userId: '1', userName: 'Jim', text: 'I\'ve drafted the project requirements document. Sharing it with the team now.', timestamp: new Date() },
  { id: '2', userId: '2', userName: 'Tim', text: 'Great! I\'ve uploaded the marketing timeline to our shared workspace.', timestamp: new Date() },
  { id: '3', userId: '3', userName: 'Kim', text: 'The design system is ready. All components are documented and ready for development.', timestamp: new Date() },
  { id: '4', userId: '1', userName: 'Jim', text: 'We should schedule user testing sessions for next week. I can coordinate that.', timestamp: new Date() },
  { id: '5', userId: '2', userName: 'Tim', text: 'Perfect! The landing page copy is ready for review. Let\'s finalize everything.', timestamp: new Date() },
  { id: '6', userId: '3', userName: 'Kim', text: 'This is coming together well! Let\'s use AI to help organize all our tasks and notes.', timestamp: new Date() }
];

const demoTasks: DemoTask[] = [
  { id: '1', title: 'Set up analytics tracking', description: 'Configure Google Analytics and custom event tracking for product launch monitoring', assignee: 'Tim', priority: 'high', status: 'pending', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
  { id: '2', title: 'Create user onboarding flow', description: 'Design and implement step-by-step user onboarding based on design mockups', assignee: 'Kim', priority: 'high', status: 'pending', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  { id: '3', title: 'Prepare launch documentation', description: 'Create comprehensive user guides, API docs, and troubleshooting materials', assignee: 'Jim', priority: 'medium', status: 'pending', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
  { id: '4', title: 'Coordinate user testing', description: 'Schedule and conduct user testing sessions, collect feedback and iterate', assignee: 'Jim', priority: 'medium', status: 'pending', dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) },
  { id: '5', title: 'Finalize marketing materials', description: 'Complete landing page copy, email campaigns, and promotional content', assignee: 'Tim', priority: 'medium', status: 'pending', dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) },
  { id: '6', title: 'Development coordination', description: 'Ensure all design and marketing materials align with development timeline', assignee: 'Kim', priority: 'high', status: 'pending', dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000) }
];

const demoNotes: DemoNote[] = [
  { id: '1', title: 'Product Launch Timeline', content: 'Key milestones: Design completion (Week 1), Development handoff (Week 2), User testing (Week 3), Marketing launch (Week 4). Critical path includes analytics setup and documentation.', type: 'document' },
  { id: '2', title: 'User Onboarding Requirements', content: 'Step 1: Account setup, Step 2: Profile completion, Step 3: Feature tour, Step 4: First task creation. Include progress indicators and help tooltips.', type: 'note' },
  { id: '3', title: 'Marketing Strategy Overview', content: 'Launch channels: Email campaign, social media, product hunt, blog post. Target metrics: 1000 signups in first week, 20% conversion rate. Budget: $5000 for paid ads.', type: 'document' },
  { id: '4', title: 'Testing & Feedback Plan', content: 'User testing sessions: 3 rounds with 5 users each. Focus areas: onboarding flow, core features, mobile responsiveness. Collect quantitative and qualitative feedback.', type: 'note' }
];

const initialState: DemoState = {
  isActive: false,
  phase: 'waiting',
  timeElapsed: 0,
  users: [],
  transcripts: [],
  messages: [],
  tasks: [],
  notes: [],
  currentUserIndex: 0,
  currentTranscriptIndex: 0,
  currentMessageIndex: 0,
  currentTaskIndex: 0,
  currentNoteIndex: 0
};

function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'START_DEMO':
      return {
        ...initialState,
        isActive: true,
        phase: 'users_joining'
      };
    case 'NEXT_PHASE':
      const phases: DemoPhase[] = ['waiting', 'users_joining', 'voice_chat', 'text_chat', 'ai_processing', 'creating_tasks', 'completed'];
      const currentIndex = phases.indexOf(state.phase);
      const nextPhase = phases[currentIndex + 1] || 'completed';
      return {
        ...state,
        phase: nextPhase
      };
    case 'UPDATE_TIME':
      return {
        ...state,
        timeElapsed: action.payload
      };
    case 'ADD_USER':
      return {
        ...state,
        users: [...state.users, action.payload],
        currentUserIndex: state.currentUserIndex + 1
      };
    case 'ADD_TRANSCRIPT':
      return {
        ...state,
        transcripts: [...state.transcripts, action.payload],
        currentTranscriptIndex: state.currentTranscriptIndex + 1
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
        currentMessageIndex: state.currentMessageIndex + 1
      };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
        currentTaskIndex: state.currentTaskIndex + 1
      };
    case 'ADD_NOTE':
      return {
        ...state,
        notes: [...state.notes, action.payload],
        currentNoteIndex: state.currentNoteIndex + 1
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface DemoContextType {
  state: DemoState;
  startDemo: () => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemoContext = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
};

interface DemoProviderProps {
  children: ReactNode;
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(demoReducer, initialState);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.isActive) {
      interval = setInterval(() => {
        dispatch({ type: 'UPDATE_TIME', payload: state.timeElapsed + 1 });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [state.isActive, state.timeElapsed]);

  useEffect(() => {
    if (!state.isActive) return;

    const timeElapsed = state.timeElapsed;

    // Phase 1: Users joining (0-15s)
    if (timeElapsed >= 3 && timeElapsed <= 15 && state.phase === 'users_joining') {
      const userIndex = Math.floor((timeElapsed - 3) / 4);
      if (userIndex < demoUsers.length && userIndex >= state.currentUserIndex) {
        dispatch({ type: 'ADD_USER', payload: demoUsers[userIndex] });
      }
      if (timeElapsed >= 15) {
        dispatch({ type: 'NEXT_PHASE' });
      }
    }

    // Phase 2: Voice chat transcripts (15-45s)
    if (timeElapsed >= 15 && timeElapsed <= 45 && state.phase === 'voice_chat') {
      const transcriptIndex = Math.floor((timeElapsed - 15) / 6);
      if (transcriptIndex < demoTranscripts.length && transcriptIndex >= state.currentTranscriptIndex) {
        dispatch({ type: 'ADD_TRANSCRIPT', payload: demoTranscripts[transcriptIndex] });
      }
      if (timeElapsed >= 45) {
        dispatch({ type: 'NEXT_PHASE' });
      }
    }

    // Phase 3: Text chat messages (45-75s)
    if (timeElapsed >= 45 && timeElapsed <= 75 && state.phase === 'text_chat') {
      const messageIndex = Math.floor((timeElapsed - 45) / 7);
      if (messageIndex < demoMessages.length && messageIndex >= state.currentMessageIndex) {
        dispatch({ type: 'ADD_MESSAGE', payload: demoMessages[messageIndex] });
      }
      if (timeElapsed >= 75) {
        dispatch({ type: 'NEXT_PHASE' });
      }
    }

    // Phase 4: AI processing (75-90s)
    if (timeElapsed >= 75 && timeElapsed <= 90 && state.phase === 'ai_processing') {
      if (timeElapsed >= 90) {
        dispatch({ type: 'NEXT_PHASE' });
      }
    }

    // Phase 5: Creating tasks and notes (90-120s)
    if (timeElapsed >= 90 && timeElapsed <= 120 && state.phase === 'creating_tasks') {
      const taskIndex = Math.floor((timeElapsed - 90) / 5);
      if (taskIndex < demoTasks.length && taskIndex >= state.currentTaskIndex) {
        dispatch({ type: 'ADD_TASK', payload: demoTasks[taskIndex] });
      }
      
      const noteIndex = Math.floor((timeElapsed - 95) / 8);
      if (noteIndex < demoNotes.length && noteIndex >= state.currentNoteIndex) {
        dispatch({ type: 'ADD_NOTE', payload: demoNotes[noteIndex] });
      }
      
      if (timeElapsed >= 120) {
        dispatch({ type: 'NEXT_PHASE' });
      }
    }
  }, [state.timeElapsed, state.isActive, state.phase, state.currentUserIndex, state.currentTranscriptIndex, state.currentMessageIndex, state.currentTaskIndex, state.currentNoteIndex]);

  const startDemo = () => {
    dispatch({ type: 'START_DEMO' });
  };

  const resetDemo = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <DemoContext.Provider value={{ state, startDemo, resetDemo }}>
      {children}
    </DemoContext.Provider>
  );
};