import { useEffect, useState, useRef, useCallback, use, useMemo } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import type { Message } from "@ai-sdk/react";
import type { tools } from "./tools";

// Component imports
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { Avatar } from "@/components/avatar/Avatar";
import { Toggle } from "@/components/toggle/Toggle";
import { Textarea } from "@/components/textarea/Textarea";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { ToolInvocationCard } from "@/components/tool-invocation-card/ToolInvocationCard";
import { MainLayout } from "@/components/layout/MainLayout";
import { LeftPanel } from "@/components/layout/LeftPanel";
import { RightPanel } from "@/components/layout/RightPanel";
import { VoicePanel } from "@/components/voice/VoicePanel";
import { TranscriptPanel } from "@/components/voice/TranscriptPanel";
import { ReferenceDrawer } from "@/components/reference/ReferenceDrawer";
import { UserNameModal } from "@/components/user/UserNameModal";
import { useTask } from "@/providers/TaskProvider";
import { useReference } from "@/providers/ReferenceProvider";
import { useVoice } from "@/providers/VoiceProvider";
import { useBackend } from "@/providers/BackendProvider";
import { useDemoContext } from "@/providers/DemoProvider";

// Icon imports
import {
  Bug,
  Moon,
  Robot,
  Sun,
  Trash,
  PaperPlaneTilt,
  Stop,
  Sparkle,
  ChatCircle,
  MagicWand,
  X,
} from "@phosphor-icons/react";

// List of tools that require human confirmation
const toolsRequiringConfirmation: (keyof typeof tools)[] = [
  "getWeatherInformation",
];

export default function Chat() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    // Check localStorage first, default to dark if not found
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  const [showDebug, setShowDebug] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState("auto");
  const [chatInput, setChatInput] = useState("");
  const [showChatOnly, setShowChatOnly] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [showUserNameModal, setShowUserNameModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use context providers for state management
  const { tasks, toggleTask, assignTask, addTask } = useTask();
  const { referenceItems, selectedItem, selectReference, addReference } = useReference();
  const { transcripts, isConnected, joinRoom, addDemoTranscript, clearTranscripts } = useVoice();
  const { processWithAI, sendMessage, messages, clearAllData, addDemoUser, addDemoMessage, addDemoTask, addDemoNote } = useBackend();
  const { state: demoState, startDemo, resetDemo } = useDemoContext();
  
  // AI processing state
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Initialize user name from localStorage or show modal
  useEffect(() => {
    const savedUserName = localStorage.getItem('userName');
    if (savedUserName) {
      setUserName(savedUserName);
      // Auto-join room with saved name
      joinRoom('hackathon-room', savedUserName);
    } else {
      // Skip modal for demo - just set a default name
      setUserName('Demo User');
      localStorage.setItem('userName', 'Demo User');
      joinRoom('hackathon-room', 'Demo User');
    }
  }, [joinRoom]);

  // Demo state managed with local state and timers
  const [demoMessages, setDemoMessages] = useState<any[]>([]);
  const [demoTasks, setDemoTasks] = useState<any[]>([]);
  const [demoNotes, setDemoNotes] = useState<any[]>([]);
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  const [demoTranscripts, setDemoTranscripts] = useState<any[]>([]);
  const [demoPhase, setDemoPhase] = useState<string>('starting');
  const [demoStarted, setDemoStarted] = useState(false);

  // Initialize demo mode on app start - RUN ONCE ONLY
  useEffect(() => {
    if (!demoStarted) {
      setDemoStarted(true);
      startDemoSequence();
    }
  }, []); // Empty dependency array to run only once

  const startDemoSequence = () => {
    if (demoStarted && demoPhase !== 'starting') {
      console.log('⚠️ Demo already started, skipping');
      return;
    }
    
    console.log('🚀 Starting demo sequence - THIS SHOULD ONLY RUN ONCE');
    setDemoPhase('users_joining');

    // Demo users - formatted for voice participants
    const users = [
      { id: '1', name: 'Jim', avatar: '👨‍💻', isMuted: false, isCurrentUser: false, audioLevel: 0, isConnected: true },
      { id: '2', name: 'Tim', avatar: '👨‍💼', isMuted: false, isCurrentUser: false, audioLevel: 0, isConnected: true },
      { id: '3', name: 'Kim', avatar: '👩‍🎨', isMuted: false, isCurrentUser: false, audioLevel: 0, isConnected: true }
    ];

    // Demo messages
    const messages = [
      { id: '1', sender_name: 'Jim', content: 'I\'ve drafted the project requirements document. Sharing it with the team now.' },
      { id: '2', sender_name: 'Tim', content: 'Great! I\'ve uploaded the marketing timeline to our shared workspace.' },
      { id: '3', sender_name: 'Kim', content: 'The design system is ready. All components are documented and ready for development.' },
      { id: '4', sender_name: 'Jim', content: 'We should schedule user testing sessions for next week. I can coordinate that.' },
      { id: '5', sender_name: 'Tim', content: 'Perfect! The landing page copy is ready for review. Let\'s finalize everything.' },
      { id: '6', sender_name: 'Kim', content: 'This is coming together well! Let\'s use AI to help organize all our tasks and notes.' }
    ];

    // Demo tasks - with backend format
    const tasks = [
      { id: '1', name: 'Set up analytics tracking', details: 'Configure Google Analytics and custom event tracking for product launch monitoring', assignee: 'Tim', priority: 'high', is_done: false, created_at: new Date() },
      { id: '2', name: 'Create user onboarding flow', details: 'Design and implement step-by-step user onboarding based on design mockups', assignee: 'Kim', priority: 'high', is_done: false, created_at: new Date() },
      { id: '3', name: 'Prepare launch documentation', details: 'Create comprehensive user guides, API docs, and troubleshooting materials', assignee: 'Jim', priority: 'medium', is_done: false, created_at: new Date() },
      { id: '4', name: 'Coordinate user testing', details: 'Schedule and conduct user testing sessions, collect feedback and iterate', assignee: 'Jim', priority: 'medium', is_done: false, created_at: new Date() },
      { id: '5', name: 'Finalize marketing materials', details: 'Complete landing page copy, email campaigns, and promotional content', assignee: 'Tim', priority: 'medium', is_done: false, created_at: new Date() },
      { id: '6', name: 'Development coordination', details: 'Ensure all design and marketing materials align with development timeline', assignee: 'Kim', priority: 'high', is_done: false, created_at: new Date() }
    ];

    // Demo notes
    const notes = [
      { id: '1', title: 'Product Launch Timeline', content: 'Key milestones: Design completion (Week 1), Development handoff (Week 2), User testing (Week 3), Marketing launch (Week 4). Critical path includes analytics setup and documentation.', type: 'document' },
      { id: '2', title: 'User Onboarding Requirements', content: 'Step 1: Account setup, Step 2: Profile completion, Step 3: Feature tour, Step 4: First task creation. Include progress indicators and help tooltips.', type: 'note' },
      { id: '3', title: 'Marketing Strategy Overview', content: 'Launch channels: Email campaign, social media, product hunt, blog post. Target metrics: 1000 signups in first week, 20% conversion rate. Budget: $5000 for paid ads.', type: 'document' },
      { id: '4', title: 'Testing & Feedback Plan', content: 'User testing sessions: 3 rounds with 5 users each. Focus areas: onboarding flow, core features, mobile responsiveness. Collect quantitative and qualitative feedback.', type: 'note' }
    ];

    // Phase 1: Add users (0-15s)
    users.forEach((user, index) => {
      setTimeout(() => {
        console.log(`👤 Adding user: ${user.name}`);
        setDemoUsers(prev => [...prev, user]);
        // Add to voice participants with proper format
        addDemoUser({
          id: user.id,
          name: user.name,
          userName: user.name,
          isMuted: false,
          isCurrentUser: false,
          audioLevel: 0,
          isConnected: true
        });
        // Add voice transcript
        addDemoTranscript({
          id: `transcript-${user.id}`,
          participantId: user.id,
          participantName: user.name,
          text: `${user.name} joined the voice chat`,
          timestamp: new Date(),
          isComplete: true
        });
        // Add directly to messages as if they're joining
        addDemoMessage({ 
          id: `user-${user.id}`, 
          sender_name: user.name, 
          content: `${user.name} joined the chat`, 
          timestamp: new Date() 
        });
      }, index * 3000); // 3 second intervals
    });

    // Phase 1.5: Add voice transcripts (12-30s)
    const transcriptMessages = [
      { userName: 'Jim', text: 'Hey team! I\'ve been thinking about our upcoming product launch. We need to start organizing everything.' },
      { userName: 'Tim', text: 'Absolutely! I\'ve been working on the marketing materials. We should coordinate with development.' },
      { userName: 'Kim', text: 'Great timing! I just finished the design mockups. We need to plan the user onboarding flow.' },
      { userName: 'Jim', text: 'Perfect! We also need to set up analytics tracking and prepare documentation.' },
      { userName: 'Tim', text: 'I can handle the analytics setup. Should we create a timeline for all these tasks?' },
      { userName: 'Kim', text: 'Yes! And we need to coordinate testing phases and feedback collection.' }
    ];

    transcriptMessages.forEach((transcript, index) => {
      setTimeout(() => {
        console.log(`🎤 Adding transcript from: ${transcript.userName}`);
        addDemoTranscript({
          id: `transcript-msg-${index}`,
          participantId: users.find(u => u.name === transcript.userName)?.id || '1',
          participantName: transcript.userName,
          text: transcript.text,
          timestamp: new Date(),
          isComplete: true
        });
      }, 12000 + index * 3000); // Start at 12s, 3 second intervals
    });

    // Phase 2: Add messages (35-65s)
    messages.forEach((message, index) => {
      setTimeout(() => {
        console.log(`💬 Adding message from: ${message.sender_name}`);
        const messageWithTimestamp = { ...message, timestamp: new Date() };
        setDemoMessages(prev => [...prev, messageWithTimestamp]);
        addDemoMessage(messageWithTimestamp);
      }, 35000 + index * 5000); // Start at 35s, 5 second intervals
    });

    // Phase 3: AI processing (45s)
    setTimeout(() => {
      console.log('🤖 Starting AI processing');
      setDemoPhase('ai_processing');
      // Don't actually call AI - just simulate it
      setTimeout(() => {
        setAiResult({
          success: true,
          tasksCreated: 6,
          notesCreated: 4,
          messagesProcessed: 6,
          transcriptsProcessed: 6
        });
      }, 2000);
    }, 45000);

    // Phase 4: Add tasks (50-80s)
    tasks.forEach((task, index) => {
      setTimeout(() => {
        console.log(`📋 Adding task: ${task.name}`);
        setDemoTasks(prev => [...prev, task]);
        addDemoTask(task);
      }, 50000 + index * 3000); // Start at 50s, 3 second intervals
    });

    // Phase 5: Add notes (55-75s)
    notes.forEach((note, index) => {
      setTimeout(() => {
        console.log(`📝 Adding note: ${note.title}`);
        setDemoNotes(prev => [...prev, note]);
        addDemoNote(note);
      }, 55000 + index * 5000); // Start at 55s, 5 second intervals
    });

    // Phase 6: Complete (90s)
    setTimeout(() => {
      console.log('✅ Demo sequence completed');
      setDemoPhase('completed');
    }, 90000);
  };


  // Handle user name submission
  const handleUserNameSubmit = (name: string) => {
    setUserName(name);
    localStorage.setItem('userName', name);
    setShowUserNameModal(false);
    // Join room with the provided name
    joinRoom('hackathon-room', name);
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Track if textarea should maintain focus
  const shouldPreserveFocus = useRef(false);

  // Focus preservation effect
  useEffect(() => {
    if (shouldPreserveFocus.current && textareaRef.current) {
      textareaRef.current.focus();
      shouldPreserveFocus.current = false;
    }
  });

  useEffect(() => {
    // Apply theme class on mount and when theme changes
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }

    // Save theme preference to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  const agent = useAgent({
    agent: "chat",
  });

  const {
    messages: agentMessages,
    input: agentInput,
    handleInputChange: handleAgentInputChange,
    handleSubmit: handleAgentSubmit,
    addToolResult,
    clearHistory,
    isLoading,
    stop,
  } = useAgentChat({
    agent,
    maxSteps: 5,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    agentMessages.length > 0 && scrollToBottom();
  }, [agentMessages, scrollToBottom]);

  const pendingToolCallConfirmation = agentMessages.some((m: Message) =>
    m.parts?.some(
      (part) =>
        part.type === "tool-invocation" &&
        part.toolInvocation.state === "call" &&
        toolsRequiringConfirmation.includes(
          part.toolInvocation.toolName as keyof typeof tools
        )
    )
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Handler functions for panels
  const handleAddReference = () => {
    // TODO: Implement add reference functionality
    console.log("Add reference clicked");
  };

  const handleSelectReferenceItem = (item: any) => {
    selectReference(item);
  };

  const handleAddTask = () => {
    // TODO: Implement add task functionality
    console.log("Add task clicked");
  };

  const handleToggleTask = (taskId: string) => {
    toggleTask(taskId);
  };

  const handleAssignTask = (taskId: string, userId: string) => {
    assignTask(taskId, userId);
  };

  const handleProcessWithAI = async () => {
    if (isProcessingAI) return;
    
    setIsProcessingAI(true);
    setAiResult(null);
    
    try {
      console.log('🤖 Starting AI processing...');
      const result = await processWithAI();
      setAiResult(result);
      
      // Show success message
      if (result.success) {
        console.log(`✅ AI processing completed! Created ${result.tasksCreated} tasks and ${result.notesCreated} notes`);
      }
    } catch (error) {
      console.error('❌ AI processing failed:', error);
      setAiResult({ success: false, error: error.message });
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Create the chat panel component - function component instead of memoized JSX
  const ChatPanel = useCallback(() => (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 flex items-center gap-3 sticky top-0 z-10 bg-white dark:bg-neutral-900">
        <div className="flex items-center justify-center h-8 w-8">
          <svg
            width="28px"
            height="28px"
            className="text-[#F48120]"
            data-icon="agents"
          >
            <title>Cloudflare Agents</title>
            <symbol id="ai:local:agents" viewBox="0 0 80 79">
              <path
                fill="currentColor"
                d="M69.3 39.7c-3.1 0-5.8 2.1-6.7 5H48.3V34h4.6l4.5-2.5c1.1.8 2.5 1.2 3.9 1.2 3.8 0 7-3.1 7-7s-3.1-7-7-7-7 3.1-7 7c0 .9.2 1.8.5 2.6L51.9 30h-3.5V18.8h-.1c-1.3-1-2.9-1.6-4.5-1.9h-.2c-1.9-.3-3.9-.1-5.8.6-.4.1-.8.3-1.2.5h-.1c-.1.1-.2.1-.3.2-1.7 1-3 2.4-4 4 0 .1-.1.2-.1.2l-.3.6c0 .1-.1.1-.1.2v.1h-.6c-2.9 0-5.7 1.2-7.7 3.2-2.1 2-3.2 4.8-3.2 7.7 0 .7.1 1.4.2 2.1-1.3.9-2.4 2.1-3.2 3.5s-1.2 2.9-1.4 4.5c-.1 1.6.1 3.2.7 4.7s1.5 2.9 2.6 4c-.8 1.8-1.2 3.7-1.1 5.6 0 1.9.5 3.8 1.4 5.6s2.1 3.2 3.6 4.4c1.3 1 2.7 1.7 4.3 2.2v-.1q2.25.75 4.8.6h.1c0 .1.1.1.1.1.9 1.7 2.3 3 4 4 .1.1.2.1.3.2h.1c.4.2.8.4 1.2.5 1.4.6 3 .8 4.5.7.4 0 .8-.1 1.3-.1h.1c1.6-.3 3.1-.9 4.5-1.9V62.9h3.5l3.1 1.7c-.3.8-.5 1.7-.5 2.6 0 3.8 3.1 7 7 7s7-3.1 7-7-3.1-7-7-7c-1.5 0-2.8.5-3.9 1.2l-4.6-2.5h-4.6V48.7h14.3c.9 2.9 3.5 5 6.7 5 3.8 0 7-3.1 7-7s-3.1-7-7-7m-7.9-16.9c1.6 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.4-3 3-3m0 41.4c1.6 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.4-3 3-3M44.3 72c-.4.2-.7.3-1.1.3-.2 0-.4.1-.5.1h-.2c-.9.1-1.7 0-2.6-.3-1-.3-1.9-.9-2.7-1.7-.7-.8-1.3-1.7-1.6-2.7l-.3-1.5v-.7q0-.75.3-1.5c.1-.2.1-.4.2-.7s.3-.6.5-.9c0-.1.1-.1.1-.2.1-.1.1-.2.2-.3s.1-.2.2-.3c0 0 0-.1.1-.1l.6-.6-2.7-3.5c-1.3 1.1-2.3 2.4-2.9 3.9-.2.4-.4.9-.5 1.3v.1c-.1.2-.1.4-.1.6-.3 1.1-.4 2.3-.3 3.4-.3 0-.7 0-1-.1-2.2-.4-4.2-1.5-5.5-3.2-1.4-1.7-2-3.9-1.8-6.1q.15-1.2.6-2.4l.3-.6c.1-.2.2-.4.3-.5 0 0 0-.1.1-.1.4-.7.9-1.3 1.5-1.9 1.6-1.5 3.8-2.3 6-2.3q1.05 0 2.1.3v-4.5c-.7-.1-1.4-.2-2.1-.2-1.8 0-3.5.4-5.2 1.1-.7.3-1.3.6-1.9 1s-1.1.8-1.7 1.3c-.3.2-.5.5-.8.8-.6-.8-1-1.6-1.3-2.6-.2-1-.2-2 0-2.9.2-1 .6-1.9 1.3-2.6.6-.8 1.4-1.4 2.3-1.8l1.8-.9-.7-1.9c-.4-1-.5-2.1-.4-3.1s.5-2.1 1.1-2.9q.9-1.35 2.4-2.1c.9-.5 2-.8 3-.7.5 0 1 .1 1.5.2 1 .2 1.8.7 2.6 1.3s1.4 1.4 1.8 2.3l4.1-1.5c-.9-2-2.3-3.7-4.2-4.9q-.6-.3-.9-.6c.4-.7 1-1.4 1.6-1.9.8-.7 1.8-1.1 2.9-1.3.9-.2 1.7-.1 2.6 0 .4.1.7.2 1.1.3V72zm25-22.3c-1.6 0-3-1.3-3-3 0-1.6 1.3-3 3-3s3 1.3 3 3c0 1.6-1.3 3-3 3"
              />
            </symbol>
            <use href="#ai:local:agents" />
          </svg>
        </div>

        <div className="flex-1">
          <h2 className="font-semibold text-base">Collaborative Project Chat</h2>
        </div>

        <div className="flex items-center gap-2 mr-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChatOnly(!showChatOnly)}
            className="flex items-center gap-1"
          >
            {showChatOnly ? <Sparkle size={16} /> : <ChatCircle size={16} />}
            {showChatOnly ? "AI Mode" : "Chat Mode"}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleProcessWithAI}
            disabled={isProcessingAI}
            className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white hover:text-white"
          >
            {isProcessingAI ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <MagicWand size={16} />
            )}
            {isProcessingAI ? "Processing..." : "AI Robot"}
          </Button>
          
          <Bug size={16} />
          <Toggle
            toggled={showDebug}
            aria-label="Toggle debug mode"
            onClick={() => setShowDebug((prev) => !prev)}
          />
        </div>

        <Button
          variant="ghost"
          size="md"
          shape="square"
          className="rounded-full h-9 w-9"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        <Button
          variant="ghost"
          size="md"
          shape="square"
          className="rounded-full h-9 w-9"
          onClick={clearHistory}
        >
          <Trash size={20} />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* AI Processing Result */}
        {aiResult && (
          <div className={`mb-4 p-3 rounded-lg ${aiResult.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
            <div className="flex items-center gap-2">
              <MagicWand size={16} className={aiResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} />
              {aiResult.success ? (
                <div className="flex-1">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✅ AI processing completed! Created {aiResult.tasksCreated} tasks and {aiResult.notesCreated} notes
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Processed {aiResult.messagesProcessed} messages and {aiResult.transcriptsProcessed} transcripts
                  </p>
                </div>
              ) : (
                <p className="text-sm text-red-700 dark:text-red-300">
                  ❌ AI processing failed: {aiResult.error}
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiResult(null)}
                className="h-6 w-6 p-0"
              >
                <X size={12} />
              </Button>
            </div>
          </div>
        )}
        
        {showChatOnly && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <ChatCircle size={16} className="text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Chat Mode: Messages will be saved but AI won't respond automatically.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleProcessWithAI}
                disabled={isProcessingAI}
                className="ml-auto"
              >
                <Sparkle size={14} className="mr-1" />
                Process with AI
              </Button>
            </div>
          </div>
        )}

        {!showChatOnly && (
          <div className="h-full flex items-center justify-center">
            <Card className="p-6 max-w-md mx-auto bg-neutral-100 dark:bg-neutral-900">
              <div className="text-center space-y-4">
                <div className="bg-[#F48120]/10 text-[#F48120] rounded-full p-3 inline-flex">
                  <Robot size={24} />
                </div>
                <h3 className="font-semibold text-lg">Welcome to Flowscribe</h3>
                <p className="text-muted-foreground text-sm">
                  Start collaborating with your team and AI assistant. Chat about your project and watch as AI creates reference materials and tasks in real-time.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Chat Messages - Show both regular messages and demo messages */}
        {(showChatOnly || true) && messages.map((message, index) => (
          <div key={message.id} className="flex justify-start">
            <div className="flex gap-2 max-w-[85%]">
              <Avatar username={message.sender_name} />
              <div>
                <Card className="p-3 rounded-md bg-neutral-100 dark:bg-neutral-900 rounded-bl-none">
                  <p className="text-sm">{message.content}</p>
                </Card>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTime(new Date(message.created_at || message.timestamp))}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* AI Messages - Always empty for demo */}
        {!showChatOnly && [].map((m: Message, index) => {
          const isUser = m.role === "user";
          const showAvatar =
            index === 0 || agentMessages[index - 1]?.role !== m.role;

          return (
            <div key={m.id}>
              {showDebug && (
                <pre className="text-xs text-muted-foreground overflow-scroll">
                  {JSON.stringify(m, null, 2)}
                </pre>
              )}
              <div
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex gap-2 max-w-[85%] ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {showAvatar && !isUser ? (
                    <Avatar username={"AI"} />
                  ) : (
                    !isUser && <div className="w-8" />
                  )}

                  <div>
                    <div>
                      {m.parts?.map((part, i) => {
                        if (part.type === "text") {
                          return (
                            <div key={i}>
                              <Card
                                className={`p-3 rounded-md bg-neutral-100 dark:bg-neutral-900 ${
                                  isUser
                                    ? "rounded-br-none"
                                    : "rounded-bl-none border-assistant-border"
                                }`}
                              >
                                <MemoizedMarkdown
                                  id={`${m.id}-${i}`}
                                  content={part.text}
                                />
                              </Card>
                              <p
                                className={`text-xs text-muted-foreground mt-1 ${
                                  isUser ? "text-right" : "text-left"
                                }`}
                              >
                                {formatTime(
                                  new Date(m.createdAt as unknown as string)
                                )}
                              </p>
                            </div>
                          );
                        }

                        if (part.type === "tool-invocation") {
                          const toolInvocation = part.toolInvocation;
                          const toolCallId = toolInvocation.toolCallId;
                          const needsConfirmation =
                            toolsRequiringConfirmation.includes(
                              toolInvocation.toolName as keyof typeof tools
                            );

                          if (showDebug) return null;

                          return (
                            <ToolInvocationCard
                              key={`${toolCallId}-${i}`}
                              toolInvocation={toolInvocation}
                              toolCallId={toolCallId}
                              needsConfirmation={needsConfirmation}
                              addToolResult={addToolResult}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (showChatOnly) {
            // Handle chat message submission
            const message = chatInput.trim();
            if (message && userName) {
              // Send chat message to backend
              sendMessage(message, userName);
              setChatInput("");
              setTextareaHeight("auto");
            }
          } else {
            // Handle AI submission
            handleAgentSubmit(e, {
              data: {
                annotations: {
                  hello: "world",
                },
              },
            });
            // Reset textarea height immediately (removed setTimeout to prevent focus loss)
            setTextareaHeight("auto");
          }
        }}
        className="p-3 bg-neutral-50 border-t border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              disabled={pendingToolCallConfirmation}
              placeholder={
                pendingToolCallConfirmation
                  ? "Please respond to the tool confirmation above..."
                  : showChatOnly
                  ? "Type your message..."
                  : "Chat with your team and AI..."
              }
              className="flex w-full border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-base ring-offset-background placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 dark:focus-visible:ring-neutral-700 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base pb-10 dark:bg-neutral-900"
              value={showChatOnly ? chatInput : agentInput}
              onChange={(e) => {
                // Mark that focus should be preserved
                shouldPreserveFocus.current = true;
                
                if (showChatOnly) {
                  setChatInput(e.target.value);
                } else {
                  handleAgentInputChange(e);
                }
                const newHeight = e.target.scrollHeight;
                e.target.style.height = "auto";
                e.target.style.height = `${newHeight}px`;
                setTextareaHeight(`${newHeight}px`);
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  const form = e.target.closest('form');
                  if (form) {
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    form.dispatchEvent(submitEvent);
                  }
                }
              }}
              rows={2}
              style={{ height: textareaHeight }}
            />
            <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
              {!showChatOnly && isLoading ? (
                <button
                  type="button"
                  onClick={stop}
                  className="inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border border-neutral-200 dark:border-neutral-800"
                  aria-label="Stop generation"
                >
                  <Stop size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border border-neutral-200 dark:border-neutral-800"
                  disabled={pendingToolCallConfirmation || (showChatOnly ? !chatInput.trim() : !agentInput.trim())}
                  aria-label="Send message"
                >
                  <PaperPlaneTilt size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  ), [
    showChatOnly,
    chatInput,
    agentInput,
    agentMessages,
    messages,
    pendingToolCallConfirmation,
    isLoading,
    textareaHeight,
    showDebug,
    theme
  ]);

  return (
    <div className="h-[100vh] w-full bg-fixed overflow-hidden">
      <HasGoogleAIKey />
      <MainLayout
        leftPanel={<LeftPanel />}
        centerPanel={ChatPanel()}
        rightPanel={<RightPanel />}
        voicePanel={
          <div className="h-full flex flex-col">
            <div className="flex-1">
              <VoicePanel />
            </div>
            <div className="h-64 border-t border-neutral-300 dark:border-neutral-800">
              <TranscriptPanel />
            </div>
          </div>
        }
      />
      <ReferenceDrawer />
    </div>
  );
}

const hasGoogleAiKeyPromise = fetch("/check-google-ai-key").then((res) =>
  res.json<{ success: boolean }>()
);

function HasGoogleAIKey() {
  const hasGoogleAiKey = use(hasGoogleAiKeyPromise);

  if (!hasGoogleAiKey.success) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/10 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-red-200 dark:border-red-900 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-labelledby="warningIcon"
                >
                  <title id="warningIcon">Warning Icon</title>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                  Google Generative AI API Key Not Configured
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 mb-1">
                  Requests to the API, including from the frontend UI, will not work until a Google Generative AI API key is configured.
                </p>
                <p className="text-neutral-600 dark:text-neutral-300">
                  Please configure a Google Generative AI API key by setting a secret named GOOGLE_GENERATIVE_AI_API_KEY. 
                  <a
                    href="https://developers.cloudflare.com/workers/configuration/secrets/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 dark:text-red-400"
                  >
                    secret
                  </a>{" "}
                  named{" "}
                  <code className="bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-red-600 dark:text-red-400 font-mono text-sm">
                    OPENAI_API_KEY
                  </code>
                  . <br />
                  You can also use a different model provider by following these{" "}
                  <a
                    href="https://github.com/cloudflare/agents-starter?tab=readme-ov-file#use-a-different-ai-model-provider"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 dark:text-red-400"
                  >
                    instructions.
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
