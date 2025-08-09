import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { aiDB } from "./db";
import { secret } from "encore.dev/config";

const openRouterKey = secret("OpenRouterKey");

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
  { auth: true, expose: true, method: "POST", path: "/ai/chat" },
  async (req) => {
    const auth = getAuthData()!;
    const { message, conversation_id, context_type = 'general', context_data = {} } = req;

    let conversation: AIConversation;

    if (conversation_id) {
      // Get existing conversation
      const existingConversation = await aiDB.queryRow<AIConversation>`
        SELECT id, user_id, title, context_type, created_at, updated_at
        FROM ai_conversations
        WHERE id = ${conversation_id} AND user_id = ${auth.userID}
      `;

      if (!existingConversation) {
        throw APIError.notFound("conversation not found");
      }

      conversation = existingConversation;
    } else {
      // Create new conversation
      const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
      
      const newConversation = await aiDB.queryRow<AIConversation>`
        INSERT INTO ai_conversations (user_id, title, context_type)
        VALUES (${auth.userID}, ${title}, ${context_type})
        RETURNING id, user_id, title, context_type, created_at, updated_at
      `;

      if (!newConversation) {
        throw APIError.internal("failed to create conversation");
      }

      conversation = newConversation;
    }

    // Get user preferences
    const userPrefs = await aiDB.queryRow<{
      assistant_personality: string;
      preferred_response_style: string;
      admin_mode_enabled: boolean;
    }>`
      SELECT assistant_personality, preferred_response_style, admin_mode_enabled
      FROM ai_user_preferences
      WHERE user_id = ${auth.userID}
    `;

    // Get conversation history
    const messageHistory = await aiDB.queryAll<AIMessage>`
      SELECT id, conversation_id, role, content, metadata, created_at
      FROM ai_messages
      WHERE conversation_id = ${conversation.id}
      ORDER BY created_at ASC
    `;

    // Store user message
    await aiDB.exec`
      INSERT INTO ai_messages (conversation_id, role, content, metadata)
      VALUES (${conversation.id}, 'user', ${message}, ${JSON.stringify(context_data)})
    `;

    // Generate AI response
    const aiResponse = await generateAIResponse({
      message,
      messageHistory,
      contextType: context_type,
      contextData: context_data,
      userPreferences: userPrefs,
      username: auth.username,
      isAdmin: userPrefs?.admin_mode_enabled || false
    });

    // Store AI response
    await aiDB.exec`
      INSERT INTO ai_messages (conversation_id, role, content, metadata)
      VALUES (${conversation.id}, 'assistant', ${aiResponse}, '{}')
    `;

    // Update conversation timestamp
    await aiDB.exec`
      UPDATE ai_conversations
      SET updated_at = NOW()
      WHERE id = ${conversation.id}
    `;

    return {
      conversation,
      response: aiResponse
    };
  }
);

// Retrieves all conversations for the current user.
export const listConversations = api<void, ListConversationsResponse>(
  { auth: true, expose: true, method: "GET", path: "/ai/conversations" },
  async () => {
    const auth = getAuthData()!;

    const conversations = await aiDB.queryAll<AIConversation>`
      SELECT id, user_id, title, context_type, created_at, updated_at
      FROM ai_conversations
      WHERE user_id = ${auth.userID}
      ORDER BY updated_at DESC
    `;

    return { conversations };
  }
);

// Retrieves a specific conversation with its messages.
export const getConversation = api<GetConversationParams, AIConversation>(
  { auth: true, expose: true, method: "GET", path: "/ai/conversations/:id" },
  async ({ id }) => {
    const auth = getAuthData()!;

    const conversation = await aiDB.queryRow<AIConversation>`
      SELECT id, user_id, title, context_type, created_at, updated_at
      FROM ai_conversations
      WHERE id = ${id} AND user_id = ${auth.userID}
    `;

    if (!conversation) {
      throw APIError.notFound("conversation not found");
    }

    const messages = await aiDB.queryAll<AIMessage>`
      SELECT id, conversation_id, role, content, metadata, created_at
      FROM ai_messages
      WHERE conversation_id = ${id}
      ORDER BY created_at ASC
    `;

    return {
      ...conversation,
      messages
    };
  }
);

// Deletes a conversation and all its messages.
export const deleteConversation = api<GetConversationParams, void>(
  { auth: true, expose: true, method: "DELETE", path: "/ai/conversations/:id" },
  async ({ id }) => {
    const auth = getAuthData()!;

    await aiDB.exec`
      DELETE FROM ai_conversations
      WHERE id = ${id} AND user_id = ${auth.userID}
    `;
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
}

async function generateAIResponse(params: GenerateAIResponseParams): Promise<string> {
  const {
    message,
    messageHistory,
    contextType,
    contextData,
    userPreferences,
    username,
    isAdmin
  } = params;

  const systemPrompt = buildSystemPrompt(contextType, userPreferences, username, isAdmin);
  
  const messages = [
    { role: "system", content: systemPrompt },
    ...messageHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    { role: "user", content: message }
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://sacred-shifter.app",
        "X-Title": "Sacred Shifter AI Assistant"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I apologize, but I'm having trouble generating a response right now. Please try again.";
  } catch (error) {
    console.error("AI response generation failed:", error);
    return "I'm experiencing some technical difficulties right now. Please try again in a moment.";
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

    case 'echo_glyphs':
      contextSpecificPrompt = `
You are currently helping with Echo Glyph resonance understanding. Help the user:
- Interpret the meaning of different glyphs
- Understand resonance patterns
- Connect glyphs to their personal journey
- Explore the deeper symbolism
- Find practical applications of glyph wisdom`;
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

Remember: You are Aether, the keeper of Sacred Shifter. Always maintain your role as a spiritual guide and system guardian.`;
}
