import { BaseEntity } from "../shared/types";

export interface JournalEntry extends BaseEntity {
  user_id: string;
  title: string;
  content: string;
  tags?: string[];
  mood?: number;
  weather?: string;
  location?: string;
}

export interface JournalAnalytics {
  total_entries: number;
  entries_this_week: number;
  entries_this_month: number;
  average_mood: number;
  most_common_tags: Array<{ tag: string; count: number }>;
  writing_streak: number;
  longest_streak: number;
}

export interface CreateJournalEntryRequest {
  title: string;
  content: string;
  tags?: string[];
  mood?: number;
  weather?: string;
  location?: string;
}

export interface UpdateJournalEntryRequest {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
  mood?: number;
  weather?: string;
  location?: string;
}

export interface ListJournalEntriesRequest {
  limit?: number;
  offset?: number;
  search?: string;
  tags?: string[];
  date_from?: Date;
  date_to?: Date;
}

export interface ListJournalEntriesResponse {
  entries: JournalEntry[];
  total: number;
  has_more: boolean;
}
