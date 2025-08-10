export interface MessageContent {
  attachments?: Attachment[];
}

export interface Attachment {
  type: 'image' | 'audio' | 'video' | 'file' | 'vigil';
  url: string;
  meta: {
    name?: string;
    size?: number;
    code?: string;
  };
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string | null;
  content: MessageContent;
  created_at: Date;
  edited_at: Date | null;
  reply_to_id: string | null;
}

export interface ThreadMember {
  user_id: string;
  display_name: string;
}

export interface Thread {
  id: string;
  is_group: boolean;
  title: string | null;
  created_at: Date;
  members: ThreadMember[];
  last_message: string | null;
  unread_count: number;
}

export interface Call {
  id: string;
  thread_id: string;
  caller_id: string;
  receiver_id: string;
  status: 'dialing' | 'answered' | 'missed' | 'declined' | 'ended';
  type: 'voice' | 'video';
  created_at: Date;
  started_at: Date | null;
  ended_at: Date | null;
  duration_seconds: number | null;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'candidate' | 'hangup';
  payload: any;
}
