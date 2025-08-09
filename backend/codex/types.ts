import { BaseEntity } from "../shared/types";

export interface CodexEntry extends BaseEntity {
  owner_id: string;
  mode: 'codex' | 'register';
  title?: string;
  content: CodexContent;
  entry_type?: string;
  tags: string[];
  resonance_rating?: number;
  resonance_signature?: string;
  resonance_channels?: string[];
  occurred_at?: Date;
  context: Record<string, any>;
  ai_summary?: string;
  ai_labels: string[];
  visibility: 'private' | 'shared' | 'public';
  is_verified: boolean;
  parent_id?: string;
}

export interface CodexContent {
  body: string;
  highlights?: string[];
  attachments?: Array<{
    type: 'url' | 'file';
    value: string;
  }>;
  metrics?: {
    breath?: string;
    hrv?: string;
    duration_sec?: number;
  };
  prompts?: string[];
  links?: string[];
}

export interface CodexShare {
  entry_id: string;
  user_id: string;
  can_edit: boolean;
  created_at: Date;
}

export interface CodexReaction {
  id: string;
  entry_id: string;
  user_id: string;
  kind: 'star' | 'support' | 'witness';
  created_at: Date;
}

export interface CreateCodexEntryRequest {
  mode: 'codex' | 'register';
  title?: string;
  content: CodexContent;
  entry_type?: string;
  tags?: string[];
  resonance_rating?: number;
  resonance_signature?: string;
  resonance_channels?: string[];
  occurred_at?: Date;
  context?: Record<string, any>;
  visibility?: 'private' | 'shared' | 'public';
  parent_id?: string;
}

export interface UpdateCodexEntryRequest {
  id: string;
  title?: string;
  content?: CodexContent;
  entry_type?: string;
  tags?: string[];
  resonance_rating?: number;
  resonance_signature?: string;
  resonance_channels?: string[];
  occurred_at?: Date;
  context?: Record<string, any>;
  visibility?: 'private' | 'shared' | 'public';
}

export interface ListCodexEntriesRequest {
  limit?: number;
  offset?: number;
  mode?: 'codex' | 'register';
  entry_type?: string;
  tags?: string[];
  search?: string;
  visibility?: 'private' | 'shared' | 'public';
  date_from?: Date;
  date_to?: Date;
  resonance_min?: number;
  resonance_max?: number;
  verified_only?: boolean;
}

export interface ListCodexEntriesResponse {
  entries: CodexEntry[];
  total: number;
  has_more: boolean;
}

export interface CodexAnalytics {
  total_entries: number;
  codex_entries: number;
  register_entries: number;
  entries_this_week: number;
  entries_this_month: number;
  average_resonance: number;
  most_common_tags: Array<{ tag: string; count: number }>;
  entry_types: Array<{ type: string; count: number }>;
  resonance_distribution: Array<{ range: string; count: number }>;
  verified_entries: number;
  shared_entries: number;
}

export interface ShareCodexEntryRequest {
  entry_id: string;
  user_id: string;
  can_edit?: boolean;
}

export interface ReactToCodexEntryRequest {
  entry_id: string;
  kind: 'star' | 'support' | 'witness';
}

export interface FindSimilarEntriesRequest {
  entry_id: string;
  limit?: number;
  mode?: 'codex' | 'register';
}

export interface SimilarEntry {
  entry: CodexEntry;
  similarity_score: number;
  matching_tags: string[];
  matching_labels: string[];
}

export interface FindSimilarEntriesResponse {
  similar_entries: SimilarEntry[];
}
