// Module-specific client wrapper for better error handling and isolation
import backend from '~backend/client';

export interface ModuleClientConfig {
  retries: number;
  timeout: number;
  fallbackData?: any;
}

export class ModuleClient {
  private config: ModuleClientConfig;

  constructor(config: Partial<ModuleClientConfig> = {}) {
    this.config = {
      retries: 3,
      timeout: 10000,
      ...config
    };
  }

  async withRetry<T>(operation: () => Promise<T>, moduleName: string): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`[${moduleName}] Attempt ${attempt} failed:`, error);
        
        if (attempt === this.config.retries) {
          break;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    // If we have fallback data and this is a read operation, return it
    if (this.config.fallbackData && lastError) {
      console.warn(`[${moduleName}] Using fallback data due to:`, lastError);
      return this.config.fallbackData;
    }
    
    throw lastError || new Error(`[${moduleName}] All retry attempts failed`);
  }
}

// Journal module client
export const journalClient = {
  async createEntry(data: any) {
    const client = new ModuleClient();
    return client.withRetry(() => backend.journal.createEntry(data), 'journal');
  },
  
  async listEntries(params?: any) {
    const client = new ModuleClient({ 
      fallbackData: { entries: [], total: 0, has_more: false } 
    });
    return client.withRetry(() => backend.journal.listEntries(params), 'journal');
  },
  
  async updateEntry(data: any) {
    const client = new ModuleClient();
    return client.withRetry(() => backend.journal.updateEntry(data), 'journal');
  },
  
  async deleteEntry(id: string) {
    const client = new ModuleClient();
    return client.withRetry(() => backend.journal.deleteEntry({ id }), 'journal');
  },
  
  async getAnalytics() {
    const client = new ModuleClient({
      fallbackData: {
        total_entries: 0,
        entries_this_week: 0,
        entries_this_month: 0,
        average_mood: 0,
        most_common_tags: [],
        writing_streak: 0,
        longest_streak: 0
      }
    });
    return client.withRetry(() => backend.journal.getAnalytics(), 'journal');
  }
};

// Meditation module client
export const meditationClient = {
  async startSession(data: any) {
    const client = new ModuleClient();
    return client.withRetry(() => backend.meditation.startSession(data), 'meditation');
  },
  
  async endSession(data: any) {
    const client = new ModuleClient();
    return client.withRetry(() => backend.meditation.endSession(data), 'meditation');
  },
  
  async getCurrentSession() {
    const client = new ModuleClient({ 
      fallbackData: { session: null } 
    });
    return client.withRetry(() => backend.meditation.getCurrentSession(), 'meditation');
  },
  
  async listSessions(params?: any) {
    const client = new ModuleClient({ 
      fallbackData: { sessions: [], total: 0, has_more: false } 
    });
    return client.withRetry(() => backend.meditation.listSessions(params), 'meditation');
  },
  
  async getAnalytics() {
    const client = new ModuleClient({
      fallbackData: {
        total_sessions: 0,
        completed_sessions: 0,
        total_meditation_time: 0,
        average_session_duration: 0,
        favorite_soundscape: null,
        current_streak: 0,
        longest_streak: 0,
        sessions_this_week: 0,
        sessions_this_month: 0,
        mood_improvement: 0,
        soundscape_breakdown: [],
        weekly_progress: []
      }
    });
    return client.withRetry(() => backend.meditation.getAnalytics(), 'meditation');
  }
};

// Community module client
export const communityClient = {
  async createSharedLearning(data: any) {
    const client = new ModuleClient();
    return client.withRetry(() => backend.community.createSharedLearning(data), 'community');
  },
  
  async listSharedLearnings() {
    const client = new ModuleClient({ 
      fallbackData: { learnings: [] } 
    });
    return client.withRetry(() => backend.community.listSharedLearnings(), 'community');
  },
  
  async sendMessage(data: any) {
    const client = new ModuleClient();
    return client.withRetry(() => backend.community.sendMessage(data), 'community');
  },
  
  async listMessages() {
    const client = new ModuleClient({ 
      fallbackData: { messages: [] } 
    });
    return client.withRetry(() => backend.community.listMessages(), 'community');
  }
};

// AI module client
export const aiClient = {
  async chat(data: any) {
    const client = new ModuleClient();
    return client.withRetry(() => backend.ai.chat(data), 'ai');
  },
  
  async listConversations() {
    const client = new ModuleClient({ 
      fallbackData: { conversations: [] } 
    });
    return client.withRetry(() => backend.ai.listConversations(), 'ai');
  },
  
  async getConversation(id: string) {
    const client = new ModuleClient();
    return client.withRetry(() => backend.ai.getConversation({ id }), 'ai');
  },
  
  async getPreferences() {
    const client = new ModuleClient({
      fallbackData: {
        user_id: 'default-user',
        assistant_personality: 'wise_guide',
        preferred_response_style: 'balanced',
        dream_analysis_enabled: true,
        journal_assistance_enabled: true,
        meditation_guidance_enabled: true,
        admin_mode_enabled: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    return client.withRetry(() => backend.ai.getPreferences(), 'ai');
  },
  
  async updatePreferences(data: any) {
    const client = new ModuleClient();
    return client.withRetry(() => backend.ai.updatePreferences(data), 'ai');
  }
};

// Echo Glyphs module client
export const echoGlyphsClient = {
  async list() {
    const client = new ModuleClient({ 
      fallbackData: { glyphs: [] } 
    });
    return client.withRetry(() => backend.echo_glyphs.list(), 'echo_glyphs');
  },
  
  async get(id: string) {
    const client = new ModuleClient();
    return client.withRetry(() => backend.echo_glyphs.get({ id }), 'echo_glyphs');
  }
};

// System health client
export const systemClient = {
  async getHealth() {
    const client = new ModuleClient({
      fallbackData: {
        system: {
          status: 'unhealthy' as const,
          timestamp: new Date(),
          uptime: 0
        },
        modules: []
      }
    });
    return client.withRetry(() => backend.system.systemHealth(), 'system');
  }
};
