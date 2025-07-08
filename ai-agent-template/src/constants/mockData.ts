// Mock data for tasks and references

export interface TaskData {
  id: string;
  title: string;
  description?: string;
  assignedTo: string;
  deadline?: Date;
  completed: boolean;
  createdAt: Date;
}

export interface ReferenceData {
  id: string;
  title: string;
  content: string;
  details: string;
  type: "document" | "link" | "note";
  createdAt: Date;
}

export const MOCK_TASKS: TaskData[] = [
  {
    id: "task-1",
    title: "Design user authentication flow",
    description: "Create wireframes and user journey for login/signup process including OAuth integration",
    assignedTo: "Sarah Chen",
    deadline: new Date(2025, 0, 15), // Jan 15, 2025
    completed: false,
    createdAt: new Date(2024, 11, 20)
  },
  {
    id: "task-2", 
    title: "Implement WebRTC voice chat",
    description: "Set up peer-to-peer audio communication with fallback to TURN servers",
    assignedTo: "Mike Johnson",
    deadline: new Date(2025, 0, 22), // Jan 22, 2025
    completed: true,
    createdAt: new Date(2024, 11, 18)
  },
  {
    id: "task-3",
    title: "Database schema optimization",
    description: "Analyze and optimize queries for better performance on large datasets",
    assignedTo: "Alex Rodriguez",
    deadline: new Date(2025, 0, 12), // Jan 12, 2025
    completed: false,
    createdAt: new Date(2024, 11, 22)
  },
  {
    id: "task-4",
    title: "Mobile responsive design",
    description: "Ensure all components work seamlessly on mobile devices",
    assignedTo: "Emma Wilson",
    deadline: new Date(2025, 0, 18), // Jan 18, 2025
    completed: false,
    createdAt: new Date(2024, 11, 21)
  },
  {
    id: "task-5",
    title: "Write API documentation",
    description: "Document all endpoints with examples and response formats",
    assignedTo: "David Park",
    deadline: new Date(2025, 0, 25), // Jan 25, 2025
    completed: true,
    createdAt: new Date(2024, 11, 19)
  },
  {
    id: "task-6",
    title: "Set up automated testing",
    description: "Configure CI/CD pipeline with unit and integration tests",
    assignedTo: "Lisa Chang",
    deadline: new Date(2025, 0, 30), // Jan 30, 2025
    completed: false,
    createdAt: new Date(2024, 11, 23)
  },
  {
    id: "task-7",
    title: "Security audit",
    description: "Review code for potential security vulnerabilities and implement fixes",
    assignedTo: "Tom Anderson",
    deadline: new Date(2025, 1, 5), // Feb 5, 2025
    completed: false,
    createdAt: new Date(2024, 11, 24)
  },
  {
    id: "task-8",
    title: "Performance monitoring",
    description: "Implement logging and monitoring for application performance metrics",
    assignedTo: "Sarah Chen",
    deadline: new Date(2025, 1, 8), // Feb 8, 2025
    completed: true,
    createdAt: new Date(2024, 11, 17)
  }
];

export const MOCK_REFERENCES: ReferenceData[] = [
  {
    id: "ref-1",
    title: "API Design Guidelines",
    content: "Comprehensive guidelines for designing RESTful APIs",
    details: `
      <h2>RESTful API Design Guidelines</h2>
      <p>This document outlines best practices for designing consistent and maintainable REST APIs.</p>
      
      <h3>1. Resource Naming</h3>
      <ul>
        <li>Use nouns for resource names (e.g., /users, /products)</li>
        <li>Use plural forms for collections</li>
        <li>Keep URLs lowercase and use hyphens for multi-word resources</li>
      </ul>
      
      <h3>2. HTTP Methods</h3>
      <ul>
        <li><strong>GET</strong> - Retrieve data</li>
        <li><strong>POST</strong> - Create new resources</li>
        <li><strong>PUT</strong> - Update entire resources</li>
        <li><strong>PATCH</strong> - Partial updates</li>
        <li><strong>DELETE</strong> - Remove resources</li>
      </ul>
      
      <h3>3. Response Formats</h3>
      <p>Always return consistent JSON responses with proper status codes and error handling.</p>
      
      <blockquote>
        <p>"Good API design is about creating intuitive interfaces that developers can easily understand and use effectively."</p>
      </blockquote>
    `,
    type: "document",
    createdAt: new Date(2024, 11, 15)
  },
  {
    id: "ref-2",
    title: "React Best Practices",
    content: "Modern React development patterns and performance optimization",
    details: `
      <h2>React Best Practices 2024</h2>
      <p>Essential patterns and techniques for building performant React applications.</p>
      
      <h3>Component Organization</h3>
      <ul>
        <li>Keep components small and focused</li>
        <li>Use composition over inheritance</li>
        <li>Implement proper prop types or TypeScript interfaces</li>
      </ul>
      
      <h3>State Management</h3>
      <p>Choose the right state management approach:</p>
      <ul>
        <li><strong>useState</strong> - Local component state</li>
        <li><strong>useContext</strong> - Shared state across components</li>
        <li><strong>useReducer</strong> - Complex state logic</li>
        <li><strong>External libraries</strong> - Global app state (Redux, Zustand)</li>
      </ul>
      
      <h3>Performance Optimization</h3>
      <ul>
        <li>Use React.memo() for expensive components</li>
        <li>Implement useMemo() and useCallback() judiciously</li>
        <li>Lazy load components with React.lazy()</li>
      </ul>
      
      <p><em>Remember: Premature optimization is the root of all evil. Profile first, then optimize.</em></p>
    `,
    type: "document",
    createdAt: new Date(2024, 11, 18)
  },
  {
    id: "ref-3",
    title: "Database Design Patterns",
    content: "Common database design patterns and when to use them",
    details: `
      <h2>Database Design Patterns</h2>
      <p>A comprehensive guide to common database design patterns and their applications.</p>
      
      <h3>Normalization vs Denormalization</h3>
      <p>Understanding when to normalize for consistency and when to denormalize for performance.</p>
      
      <h4>Normalization Benefits:</h4>
      <ul>
        <li>Reduces data redundancy</li>
        <li>Maintains data integrity</li>
        <li>Easier to maintain and update</li>
      </ul>
      
      <h4>Denormalization Benefits:</h4>
      <ul>
        <li>Improved query performance</li>
        <li>Reduced join operations</li>
        <li>Better for read-heavy applications</li>
      </ul>
      
      <h3>Indexing Strategies</h3>
      <p>Proper indexing is crucial for database performance:</p>
      <ul>
        <li>Create indexes on frequently queried columns</li>
        <li>Use composite indexes for multi-column queries</li>
        <li>Monitor index usage and remove unused indexes</li>
      </ul>
      
      <h3>Partitioning</h3>
      <p>Divide large tables into smaller, more manageable pieces while maintaining logical unity.</p>
    `,
    type: "document",
    createdAt: new Date(2024, 11, 12)
  },
  {
    id: "ref-4",
    title: "Authentication Research",
    content: "Research notes on modern authentication methods",
    details: `
      <h2>Authentication Research Notes</h2>
      <p>Research findings on modern authentication methods and security considerations.</p>
      
      <h3>OAuth 2.0 vs OpenID Connect</h3>
      <p>Understanding the differences and when to use each:</p>
      <ul>
        <li><strong>OAuth 2.0</strong> - Authorization framework</li>
        <li><strong>OpenID Connect</strong> - Identity layer on top of OAuth 2.0</li>
      </ul>
      
      <h3>Multi-Factor Authentication (MFA)</h3>
      <p>Implementation strategies for enhanced security:</p>
      <ul>
        <li>SMS-based (not recommended for high security)</li>
        <li>Time-based OTP (TOTP) apps</li>
        <li>Hardware security keys (WebAuthn)</li>
        <li>Biometric authentication</li>
      </ul>
      
      <h3>Session Management</h3>
      <p>Best practices for secure session handling:</p>
      <ul>
        <li>Use secure, httpOnly cookies</li>
        <li>Implement proper session timeout</li>
        <li>Rotate session tokens regularly</li>
      </ul>
      
      <blockquote>
        <p>"Security is not a product, but a process." - Bruce Schneier</p>
      </blockquote>
    `,
    type: "note",
    createdAt: new Date(2024, 11, 20)
  },
  {
    id: "ref-5",
    title: "WebRTC Documentation",
    content: "Technical documentation for WebRTC implementation",
    details: `
      <h2>WebRTC Implementation Guide</h2>
      <p>Technical documentation for implementing real-time communication features.</p>
      
      <h3>WebRTC Architecture</h3>
      <p>Understanding the peer-to-peer communication model:</p>
      <ul>
        <li><strong>Signaling</strong> - Exchange connection information</li>
        <li><strong>STUN/TURN</strong> - NAT traversal and relay servers</li>
        <li><strong>Media Streams</strong> - Audio/video data transmission</li>
      </ul>
      
      <h3>Implementation Steps</h3>
      <ol>
        <li>Set up signaling server (WebSocket or Socket.io)</li>
        <li>Implement peer connection establishment</li>
        <li>Handle ICE candidate exchange</li>
        <li>Manage media streams</li>
        <li>Add error handling and reconnection logic</li>
      </ol>
      
      <h3>Code Example</h3>
      <pre><code>const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Send candidate to remote peer
          sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };</code></pre>
      
      <h3>Common Issues</h3>
      <ul>
        <li>Firewall and NAT traversal problems</li>
        <li>Browser compatibility differences</li>
        <li>Network connectivity issues</li>
      </ul>
    `,
    type: "document",
    createdAt: new Date(2024, 11, 22)
  },
  {
    id: "ref-6",
    title: "UI/UX Design System",
    content: "Design system documentation and component library",
    details: `
      <h2>Design System Documentation</h2>
      <p>Comprehensive guide to our design system principles and component library.</p>
      
      <h3>Design Principles</h3>
      <ul>
        <li><strong>Consistency</strong> - Uniform patterns and behaviors</li>
        <li><strong>Accessibility</strong> - Inclusive design for all users</li>
        <li><strong>Simplicity</strong> - Clean, intuitive interfaces</li>
        <li><strong>Flexibility</strong> - Adaptable to different contexts</li>
      </ul>
      
      <h3>Color System</h3>
      <p>Our color palette is designed for accessibility and visual hierarchy:</p>
      <ul>
        <li><strong>Primary</strong> - Main brand colors</li>
        <li><strong>Secondary</strong> - Supporting colors</li>
        <li><strong>Neutral</strong> - Text and background colors</li>
        <li><strong>Semantic</strong> - Success, warning, error colors</li>
      </ul>
      
      <h3>Typography</h3>
      <p>Font hierarchy and usage guidelines:</p>
      <ul>
        <li>Headlines: 32px, 24px, 20px</li>
        <li>Body text: 16px, 14px</li>
        <li>Caption: 12px</li>
        <li>Line height: 1.5 for body text</li>
      </ul>
      
      <h3>Component Library</h3>
      <p>Reusable components with consistent styling and behavior:</p>
      <ul>
        <li>Buttons (primary, secondary, ghost)</li>
        <li>Form elements (input, textarea, select)</li>
        <li>Cards and containers</li>
        <li>Navigation components</li>
      </ul>
    `,
    type: "document",
    createdAt: new Date(2024, 11, 14)
  }
];