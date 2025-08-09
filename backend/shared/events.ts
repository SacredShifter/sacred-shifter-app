// Event system for inter-module communication without tight coupling
export interface DomainEvent {
  id: string;
  type: string;
  module: string;
  timestamp: Date;
  data: Record<string, any>;
  version: number;
}

export interface EventHandler<T = any> {
  eventType: string;
  handle(event: DomainEvent & { data: T }): Promise<void>;
}

// Event types for cross-module communication
export const EventTypes = {
  // Journal events
  JOURNAL_ENTRY_CREATED: 'journal.entry.created',
  JOURNAL_ENTRY_UPDATED: 'journal.entry.updated',
  JOURNAL_ENTRY_DELETED: 'journal.entry.deleted',
  
  // Meditation events
  MEDITATION_SESSION_STARTED: 'meditation.session.started',
  MEDITATION_SESSION_COMPLETED: 'meditation.session.completed',
  
  // Community events
  LEARNING_SHARED: 'community.learning.shared',
  MESSAGE_SENT: 'community.message.sent',
  
  // AI events
  AI_CONVERSATION_STARTED: 'ai.conversation.started',
  AI_RESPONSE_GENERATED: 'ai.response.generated',
  
  // Echo Glyphs events
  GLYPH_DISCOVERED: 'echo_glyphs.glyph.discovered',
  RESONANCE_DETECTED: 'echo_glyphs.resonance.detected',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];
