import { routeAgentRequest, type Schedule } from "agents";

import { unstable_getSchedulePrompt } from "agents/schedule";

import { AIChatAgent } from "agents/ai-chat-agent";
import {
  createDataStreamResponse,
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
  type ToolSet,
} from "ai";
//import { openai } from "@ai-sdk/openai";
//import {anthropic} from "@ai-sdk/anthropic";
import {google} from "@ai-sdk/google";
import { processToolCalls } from "./utils";
import { tools, executions } from "./tools";
// import { env } from "cloudflare:workers";
import { fiberplane, withInstrumentation } from "@fiberplane/agents";

//const model = openai("gpt-4o-2024-11-20");
//const model = anthropic("claude-3-5-sonnet-latest");
const model = google("gemini-2.5-pro");
// Cloudflare AI Gateway
// const openai = createOpenAI({
//   apiKey: env.OPENAI_API_KEY,
//   baseURL: env.GATEWAY_BASE_URL,
// });

/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
//export
export class ChatInternal extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   * @param onFinish - Callback function executed when streaming completes
   */

  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal }
  ) {
    // const mcpConnection = await this.mcp.connect(
    //   "https://path-to-mcp-server/sse"
    // );

    // Collect all tools, including MCP tools
    const allTools = {
      ...tools,
      ...this.mcp.unstable_getAITools(),
    };

    // Create a streaming response that handles both text and tool outputs
    const dataStreamResponse = createDataStreamResponse({
      execute: async (dataStream) => {
        // Process any pending tool calls from previous messages
        // This handles human-in-the-loop confirmations for tools
        const processedMessages = await processToolCalls({
          messages: this.messages,
          dataStream,
          tools: allTools,
          executions,
        });

        // Stream the AI response using GPT-4
        const result = streamText({
          model,
          system: `You are a helpful assistant that can do various tasks... 

${unstable_getSchedulePrompt({ date: new Date() })}

If the user asks to schedule a task, use the schedule tool to schedule the task.
`,
          messages: processedMessages,
          tools: allTools,
          onFinish: async (args) => {
            onFinish(
              args as Parameters<StreamTextOnFinishCallback<ToolSet>>[0]
            );
            // await this.mcp.closeConnection(mcpConnection.id);
          },
          onError: (error) => {
            console.error("Error while streaming:", error);
          },
          maxSteps: 10,
        });

        // Merge the AI response stream with tool execution outputs
        result.mergeIntoDataStream(dataStream);
      },
    });

    return dataStreamResponse;
  }
  async executeTask(description: string, task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        content: `Running scheduled task: ${description}`,
        createdAt: new Date(),
      },
    ]);
  }

  /**
   * Handle voice chat requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle voice chat internal requests
    if (path.startsWith("/voice/")) {
      return await this.handleVoiceRequest(path, method, request);
    }

    // Fall back to parent fetch handler
    return await super.fetch(request);
  }

  private async handleVoiceRequest(path: string, method: string, request: Request): Promise<Response> {
    try {
      switch (true) {
        case path === "/voice/join" && method === "POST":
          return await this.handleVoiceJoin(request);
        
        case path === "/voice/peers" && method === "GET":
          return await this.handleVoiceGetPeers();
        
        case path === "/voice/leave" && method === "POST":
          return await this.handleVoiceLeave(request);
        
        case path === "/voice/heartbeat" && method === "POST":
          return await this.handleVoiceHeartbeat(request);
        
        case path === "/voice/offer" && method === "POST":
          return await this.handleVoiceOffer(request);
        
        case path === "/voice/answer" && method === "POST":
          return await this.handleVoiceAnswer(request);
        
        case path === "/voice/ice-candidate" && method === "POST":
          return await this.handleVoiceICECandidate(request);
        
        case path.startsWith("/voice/signaling/") && method === "GET":
          const participantId = path.split("/")[3];
          return await this.handleVoiceGetSignaling(participantId);
        
        case path === "/voice/transcript" && method === "POST":
          return await this.handleVoiceTranscript(request);
        
        case path === "/voice/transcripts" && method === "GET":
          return await this.handleVoiceGetTranscripts();
        
        default:
          return new Response("Voice endpoint not found", { status: 404 });
      }
    } catch (error) {
      console.error("Voice request error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  private async handleVoiceJoin(request: Request): Promise<Response> {
    const { participantId, name } = await request.json() as { participantId: string; name: string };
    
    // Get current participants
    const voiceParticipants = await this.ctx.storage.get("voice-participants") || {};
    
    // Add new participant
    voiceParticipants[participantId] = {
      id: participantId,
      name,
      lastSeen: Date.now(),
      isConnected: true,
      isMuted: false,
      audioLevel: 0
    };
    
    await this.ctx.storage.put("voice-participants", voiceParticipants);
    
    return Response.json({ success: true });
  }

  private async handleVoiceGetPeers(): Promise<Response> {
    const voiceParticipants = await this.ctx.storage.get("voice-participants") || {};
    const cutoff = Date.now() - 15000; // 15 seconds timeout
    
    // Filter out expired participants
    const activePeers = Object.values(voiceParticipants).filter((peer: any) => peer.lastSeen > cutoff);
    
    return Response.json(activePeers);
  }

  private async handleVoiceLeave(request: Request): Promise<Response> {
    const { participantId } = await request.json() as { participantId: string };
    
    const voiceParticipants = await this.ctx.storage.get("voice-participants") || {};
    delete voiceParticipants[participantId];
    
    await this.ctx.storage.put("voice-participants", voiceParticipants);
    
    // Clean up signaling data
    await this.ctx.storage.delete(`voice-signaling-${participantId}`);
    
    return Response.json({ success: true });
  }

  private async handleVoiceHeartbeat(request: Request): Promise<Response> {
    const { participantId } = await request.json() as { participantId: string };
    
    const voiceParticipants = await this.ctx.storage.get("voice-participants") || {};
    if (voiceParticipants[participantId]) {
      voiceParticipants[participantId].lastSeen = Date.now();
      await this.ctx.storage.put("voice-participants", voiceParticipants);
    }
    
    return Response.json({ success: true });
  }

  private async handleVoiceOffer(request: Request): Promise<Response> {
    const { from, to, offer } = await request.json() as { from: string; to: string; offer: any };
    
    // Store offer for the target participant
    const key = `voice-signaling-${to}`;
    const signaling = await this.ctx.storage.get(key) || { offers: [], answers: [], candidates: [] };
    signaling.offers.push({ from, offer, timestamp: Date.now() });
    
    await this.ctx.storage.put(key, signaling);
    
    return Response.json({ success: true });
  }

  private async handleVoiceAnswer(request: Request): Promise<Response> {
    const { from, to, answer } = await request.json() as { from: string; to: string; answer: any };
    
    // Store answer for the target participant
    const key = `voice-signaling-${to}`;
    const signaling = await this.ctx.storage.get(key) || { offers: [], answers: [], candidates: [] };
    signaling.answers.push({ from, answer, timestamp: Date.now() });
    
    await this.ctx.storage.put(key, signaling);
    
    return Response.json({ success: true });
  }

  private async handleVoiceICECandidate(request: Request): Promise<Response> {
    const { from, to, candidate } = await request.json() as { from: string; to: string; candidate: any };
    
    // Store ICE candidate for the target participant
    const key = `voice-signaling-${to}`;
    const signaling = await this.ctx.storage.get(key) || { offers: [], answers: [], candidates: [] };
    signaling.candidates.push({ from, candidate, timestamp: Date.now() });
    
    await this.ctx.storage.put(key, signaling);
    
    return Response.json({ success: true });
  }

  private async handleVoiceGetSignaling(participantId: string): Promise<Response> {
    const key = `voice-signaling-${participantId}`;
    const signaling = await this.ctx.storage.get(key) || { offers: [], answers: [], candidates: [] };
    
    // Clear signaling data after reading
    await this.ctx.storage.put(key, { offers: [], answers: [], candidates: [] });
    
    return Response.json(signaling);
  }

  private async handleVoiceTranscript(request: Request): Promise<Response> {
    const { participantId, participantName, text, isComplete } = await request.json() as {
      participantId: string;
      participantName: string;
      text: string;
      isComplete: boolean;
    };
    
    // Get current transcripts
    const transcripts = await this.ctx.storage.get("voice-transcripts") || [];
    
    // Add new transcript
    const transcript = {
      id: crypto.randomUUID(),
      participantId,
      participantName,
      text,
      isComplete,
      timestamp: new Date().toISOString()
    };
    
    transcripts.push(transcript);
    
    // Keep only last 100 transcripts
    if (transcripts.length > 100) {
      transcripts.splice(0, transcripts.length - 100);
    }
    
    await this.ctx.storage.put("voice-transcripts", transcripts);
    
    return Response.json({ success: true });
  }

  private async handleVoiceGetTranscripts(): Promise<Response> {
    const transcripts = await this.ctx.storage.get("voice-transcripts") || [];
    return Response.json(transcripts);
  }
}

export const Chat = withInstrumentation(ChatInternal);

/**
 * Handle voice chat API requests using Durable Objects for shared state
 */
async function handleVoiceRequest(request: Request, env: Env, url: URL): Promise<Response> {
  const path = url.pathname;
  const method = request.method;

  // Get the shared Chat Durable Object instance that all devices connect to
  const chatId = env.Chat.idFromName("voice-room");
  const chat = env.Chat.get(chatId);

  try {
    switch (true) {
      case path === "/api/voice/join" && method === "POST":
        const joinData = await request.json() as { participantId: string; name: string };
        const joinRequest = new Request("http://internal/voice/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(joinData)
        });
        return await chat.fetch(joinRequest);
      
      case path === "/api/voice/peers" && method === "GET":
        const peersRequest = new Request("http://internal/voice/peers", { method: "GET" });
        return await chat.fetch(peersRequest);
      
      case path === "/api/voice/leave" && method === "POST":
        const leaveData = await request.json() as { participantId: string };
        const leaveRequest = new Request("http://internal/voice/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leaveData)
        });
        return await chat.fetch(leaveRequest);
      
      case path === "/api/voice/heartbeat" && method === "POST":
        const heartbeatData = await request.json() as { participantId: string };
        const heartbeatRequest = new Request("http://internal/voice/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(heartbeatData)
        });
        return await chat.fetch(heartbeatRequest);
      
      case path === "/api/voice/offer" && method === "POST":
        const offerData = await request.json() as { from: string; to: string; offer: any };
        const offerRequest = new Request("http://internal/voice/offer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(offerData)
        });
        return await chat.fetch(offerRequest);
      
      case path === "/api/voice/answer" && method === "POST":
        const answerData = await request.json() as { from: string; to: string; answer: any };
        const answerRequest = new Request("http://internal/voice/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answerData)
        });
        return await chat.fetch(answerRequest);
      
      case path === "/api/voice/ice-candidate" && method === "POST":
        const candidateData = await request.json() as { from: string; to: string; candidate: any };
        const candidateRequest = new Request("http://internal/voice/ice-candidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(candidateData)
        });
        return await chat.fetch(candidateRequest);
      
      case path.startsWith("/api/voice/signaling/") && method === "GET":
        const participantId = path.split("/")[4];
        const signalingRequest = new Request(`http://internal/voice/signaling/${participantId}`, { method: "GET" });
        return await chat.fetch(signalingRequest);
      
      case path === "/api/voice/transcript" && method === "POST":
        const transcriptData = await request.json() as { participantId: string; participantName: string; text: string; isComplete: boolean };
        const transcriptRequest = new Request("http://internal/voice/transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transcriptData)
        });
        return await chat.fetch(transcriptRequest);
      
      case path === "/api/voice/transcripts" && method === "GET":
        const transcriptsRequest = new Request("http://internal/voice/transcripts", { method: "GET" });
        return await chat.fetch(transcriptsRequest);
      
      default:
        return new Response("Voice API endpoint not found", { status: 404 });
    }
  } catch (error) {
    console.error("Voice API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}


/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/check-google-ai-key") {
      const hasGoogleAIKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      return Response.json({
        success: hasGoogleAIKey,
      });
    }

    // Voice chat API endpoints - handle before other processing to avoid body consumption
    if (url.pathname.startsWith("/api/voice/")) {
      return await handleVoiceRequest(request, env, url);
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error(
        "GOOGLE_GENERATIVE_AI_API_KEY is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
      );
    }
    return fiberplane(
      async (request: Request, env: Env, ctx: ExecutionContext) => {
        return (
          // Route the request to our agent or return 404 if not found
          (await routeAgentRequest(request, env)) ||
          new Response("Not found", { status: 404 })
        );
      }
    )(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

// export default {
//   async fetch(request: Request, env: Env, ctx: ExecutionContext) {
//     const url = new URL(request.url);

//     if (url.pathname === "/check-open-ai-key") {
//       const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
//       return Response.json({
//         success: hasOpenAIKey,
//       });
//     }
//     if (!process.env.OPENAI_API_KEY) {
//       console.error(
//         "OPENAI_API_KEY is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
//       );
//     }
//     return (
//       // Route the request to our agent or return 404 if not found
//       (await routeAgentRequest(request, env)) ||
//       new Response("Not found", { status: 404 })
//     );
//   },
// } satisfies ExportedHandler<Env>;
