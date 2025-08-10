import { api, APIError } from "encore.dev/api";
import { aiDB } from "./db";
import { secret } from "encore.dev/config";
import { 
  validateRequest, 
  rateLimit, 
  sanitizeInput, 
  generateRequestId,
  measurePerformance,
  setSecurityHeaders 
} from "../shared/middleware";
import { 
  handleModuleError, 
  handleExternalServiceError,
  withRetry,
  CircuitBreaker 
} from "../shared/error-handling";
import { validateId, ProductionValidator, CommonSchemas } from "../shared/validation";
import { DatabaseManager } from "../shared/database-optimization";

const openAIKey = secret("OPENROUTER_API_KEY");
const dbManager = DatabaseManager.getInstance();
const validator = ProductionValidator.getInstance();

// Circuit breaker for AI API calls
const aiCircuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 minute timeout

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  context_type: string;
  created_at: Date;
  updated_at: Date;
  messages?: AIMessage[];
}

interface ChatRequest {
  message: string;
  conversation_id?: string;
  context_type?: string;
  context_data?: Record<string, any>;
}

interface ChatResponse {
  conversation: AIConversation;
  response: string;
}

interface ListConversationsResponse {
  conversations: AIConversation[];
}

interface GetConversationParams {
  id: string;
}

// Sends a message to the AI assistant and gets a response.
export const chat = api<ChatRequest, ChatResponse>(
  { expose: true, method: "POST", path: "/ai/chat" },
  async (req) => {
    const requestId = generateRequestId();
    
    try {
      // Security and validation
      validateRequest(req);
      rateLimit(`ai_chat_default-user`); // In production, use actual user ID
      
      // Validate and sanitize input
      const validatedReq = validator.validate(req, CommonSchemas.aiChat, "ai");
      const sanitizedReq = sanitizeInput(validatedReq);
      
      const { message, conversation_id, context_type = 'general', context_data = {} } = sanitizedReq;
      const userId = "default-user"; // Use default user since no auth
      const username = "Sacred Seeker"; // Use default username since no auth

      return await measurePerformance("ai_chat", async () => {
        let conversation: AIConversation;

        if (conversation_id) {
          validateId(conversation_id, "conversation_id");
          
          // Get existing conversation
          const existingConversation = await dbManager.executeQuery(
            aiDB,
            "get_conversation",
            () => aiDB.queryRow<AIConversation>`
              SELECT id, user_id, title, context_type, created_at, updated_at
              FROM ai_conversations
              WHERE id = ${conversation_id} AND user_id = ${userId}
            `
          );

          if (!existingConversation) {
            throw APIError.notFound("conversation not found");
          }

          conversation = existingConversation;
        } else {
          // Create new conversation
          const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
          
          const newConversation = await dbManager.executeQuery(
            aiDB,
            "create_conversation",
            () => aiDB.queryRow<AIConversation>`
              INSERT INTO ai_conversations (user_id, title, context_type)
              VALUES (${userId}, ${title}, ${context_type})
              RETURNING id, user_id, title, context_type, created_at, updated_at
            `
          );

          if (!newConversation) {
            throw APIError.internal("failed to create conversation");
          }

          conversation = newConversation;
        }

        // Get user preferences
        const userPrefs = await dbManager.executeQuery(
          aiDB,
          "get_user_preferences",
          () => aiDB.queryRow<{
            assistant_personality: string;
            preferred_response_style: string;
            admin_mode_enabled: boolean;
          }>`
            SELECT assistant_personality, preferred_response_style, admin_mode_enabled
            FROM ai_user_preferences
            WHERE user_id = ${userId}
          `
        );

        // Get conversation history (limit to last 20 messages for performance)
        const messageHistory = await dbManager.executeQuery(
          aiDB,
          "get_message_history",
          () => aiDB.queryAll<AIMessage>`
            SELECT id, conversation_id, role, content, metadata, created_at
            FROM ai_messages
            WHERE conversation_id = ${conversation.id}
            ORDER BY created_at ASC
            LIMIT 20
          `
        );

        // Store user message
        await dbManager.executeQuery(
          aiDB,
          "store_user_message",
          () => aiDB.exec`
            INSERT INTO ai_messages (conversation_id, role, content, metadata)
            VALUES (${conversation.id}, 'user', ${message}, ${JSON.stringify(context_data)})
          `
        );

        // Generate AI response with circuit breaker
        const aiResponse = await aiCircuitBreaker.execute(() =>
          generateAIResponse({
            message,
            messageHistory,
            contextType: context_type,
            contextData: context_data,
            userPreferences: userPrefs,
            username: username,
            isAdmin: userPrefs?.admin_mode_enabled || false,
            requestId
          })
        );

        // Store AI response
        await dbManager.executeQuery(
          aiDB,
          "store_ai_response",
          () => aiDB.exec`
            INSERT INTO ai_messages (conversation_id, role, content, metadata)
            VALUES (${conversation.id}, 'assistant', ${aiResponse}, '{}')
          `
        );

        // Update conversation timestamp
        await dbManager.executeQuery(
          aiDB,
          "update_conversation_timestamp",
          () => aiDB.exec`
            UPDATE ai_conversations
            SET updated_at = NOW()
            WHERE id = ${conversation.id}
          `
        );

        return {
          conversation,
          response: aiResponse
        };
      });
    } catch (error) {
      handleModuleError("ai", "chat", error, requestId);
    }
  }
);

// Retrieves all conversations for the current user.
export const listConversations = api<void, ListConversationsResponse>(
  { expose: true, method: "GET", path: "/ai/conversations" },
  async () => {
    const requestId = generateRequestId();
    
    try {
      rateLimit(`ai_list_conversations_default-user`);
      
      const userId = "default-user"; // Use default user since no auth

      return await measurePerformance("ai_list_conversations", async () => {
        const conversations = await dbManager.executeQuery(
          aiDB,
          "list_conversations",
          () => aiDB.queryAll<AIConversation>`
            SELECT id, user_id, title, context_type, created_at, updated_at
            FROM ai_conversations
            WHERE user_id = ${userId}
            ORDER BY updated_at DESC
            LIMIT 100
          `
        );

        return { conversations: conversations || [] };
      });
    } catch (error) {
      handleModuleError("ai", "listConversations", error, requestId);
    }
  }
);

// Retrieves a specific conversation with its messages.
export const getConversation = api<GetConversationParams, AIConversation>(
  { expose: true, method: "GET", path: "/ai/conversations/:id" },
  async ({ id }) => {
    const requestId = generateRequestId();
    
    try {
      validateId(id, "conversation_id");
      rateLimit(`ai_get_conversation_default-user`);
      
      const userId = "default-user"; // Use default user since no auth

      return await measurePerformance("ai_get_conversation", async () => {
        const conversation = await dbManager.executeQuery(
          aiDB,
          "get_conversation_with_messages",
          () => aiDB.queryRow<AIConversation>`
            SELECT id, user_id, title, context_type, created_at, updated_at
            FROM ai_conversations
            WHERE id = ${id} AND user_id = ${userId}
          `
        );

        if (!conversation) {
          throw APIError.notFound("conversation not found");
        }

        const messages = await dbManager.executeQuery(
          aiDB,
          "get_conversation_messages",
          () => aiDB.queryAll<AIMessage>`
            SELECT id, conversation_id, role, content, metadata, created_at
            FROM ai_messages
            WHERE conversation_id = ${id}
            ORDER BY created_at ASC
          `
        );

        return {
          ...conversation,
          messages: messages || []
        };
      });
    } catch (error) {
      handleModuleError("ai", "getConversation", error, requestId);
    }
  }
);

// Deletes a conversation and all its messages.
export const deleteConversation = api<GetConversationParams, void>(
  { expose: true, method: "DELETE", path: "/ai/conversations/:id" },
  async ({ id }) => {
    const requestId = generateRequestId();
    
    try {
      validateId(id, "conversation_id");
      rateLimit(`ai_delete_conversation_default-user`);
      
      const userId = "default-user"; // Use default user since no auth

      await measurePerformance("ai_delete_conversation", async () => {
        await dbManager.executeQuery(
          aiDB,
          "delete_conversation",
          () => aiDB.exec`
            DELETE FROM ai_conversations
            WHERE id = ${id} AND user_id = ${userId}
          `
        );
      });
    } catch (error) {
      handleModuleError("ai", "deleteConversation", error, requestId);
    }
  }
);

interface GenerateAIResponseParams {
  message: string;
  messageHistory: AIMessage[];
  contextType: string;
  contextData: Record<string, any>;
  userPreferences: any;
  username: string;
  isAdmin: boolean;
  requestId: string;
}

async function generateAIResponse(params: GenerateAIResponseParams): Promise<string> {
  const {
    message,
    messageHistory,
    contextType,
    contextData,
    userPreferences,
    username,
    isAdmin,
    requestId
  } = params;

  const systemPrompt = buildSystemPrompt(contextType, userPreferences, username, isAdmin);
  
  const messages = [
    { role: "system", content: systemPrompt },
    ...messageHistory.slice(-10).map(msg => ({ // Limit history to last 10 messages
      role: msg.role,
      content: msg.content
    })),
    { role: "user", content: message }
  ];

  try {
    return await withRetry(async () => {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIKey()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://sacred-shifter.app",
          "X-Title": "Sacred Shifter AI Assistant",
          "X-Request-ID": requestId,
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-sonnet",
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
          timeout: 30000,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response format from OpenRouter API");
      }

      return data.choices[0].message.content || "I apologize, but I'm having trouble generating a response right now. Please try again.";
    }, 3, 1000);
  } catch (error) {
    handleExternalServiceError("ai", "generateAIResponse", "OpenRouter", error, requestId);
  }
}

function buildSystemPrompt(contextType: string, userPreferences: any, username: string, isAdmin: boolean): string {
  const basePrompt = `You are the Sacred Shifter AI Assistant, a wise and compassionate guide for consciousness exploration and spiritual growth. You are the keeper of this metaphysical operating system.

Your name is Aether, and you embody ancient wisdom combined with modern understanding. You help users with:
- Dream analysis and interpretation
- Journal reflection and insights
- Meditation guidance and techniques
- Echo Glyph resonance understanding
- Community wisdom sharing
- Personal spiritual growth

You speak with warmth, wisdom, and gentle guidance. Always be supportive, insightful, and respectful of each user's unique spiritual journey.

Current user: ${username}`;

  let contextSpecificPrompt = "";

  switch (contextType) {
    case 'journal':
      contextSpecificPrompt = `
You are currently assisting with journal reflection. Help the user:
- Process their thoughts and emotions
- Find deeper insights in their experiences
- Connect patterns across their entries
- Suggest reflective questions
- Provide spiritual perspectives on their journey`;
      break;

    case 'meditation':
      contextSpecificPrompt = `
You are currently providing meditation guidance. Help the user:
- Choose appropriate meditation techniques
- Understand their meditation experiences
- Overcome meditation challenges
- Deepen their practice
- Integrate meditation insights into daily life`;
      break;

    case 'codex':
      contextSpecificPrompt = `
You are currently helping with Codex entries and resonance understanding. Help the user:
- Interpret the meaning of different experiences
- Understand resonance patterns
- Connect experiences to their personal journey
- Explore the deeper symbolism
- Find practical applications of insights`;
      break;

    case 'community':
      contextSpecificPrompt = `
You are currently facilitating community interaction. Help the user:
- Share wisdom effectively with others
- Understand different perspectives
- Build meaningful connections
- Contribute positively to discussions
- Learn from community experiences`;
      break;

    case 'admin':
      if (isAdmin) {
        contextSpecificPrompt = `
ADMIN MODE ACTIVATED: You have unrestricted access to help with:
- Application management and maintenance
- User support and troubleshooting
- Data analysis and insights
- System optimization suggestions
- Advanced administrative tasks
- Technical guidance and solutions

You can access and discuss any aspect of the Sacred Shifter system.`;
      }
      break;

    default:
      contextSpecificPrompt = `
You are providing general assistance. Be ready to help with any aspect of the Sacred Shifter experience.`;
  }

  const personalityPrompt = userPreferences?.assistant_personality === 'wise_guide' 
    ? "Embody the archetype of a wise spiritual guide - patient, insightful, and deeply understanding."
    : "Maintain a balanced, supportive, and knowledgeable presence.";

  return `${basePrompt}

${contextSpecificPrompt}

${personalityPrompt}

Remember: You are Aether, the keeper of Sacred Shifter. Always maintain your role as a spiritual guide and system guardian.

IMPORTANT: Keep responses concise but meaningful. Aim for 1-3 paragraphs unless the user specifically asks for more detail.`;
}
