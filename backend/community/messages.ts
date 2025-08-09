import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { communityDB } from "./db";

export interface Message {
  id: string;
  sender_id: string;
  sender_username: string;
  recipient_id: string;
  recipient_username: string;
  content: string;
  read_at: Date | null;
  created_at: Date;
}

interface SendMessageRequest {
  recipient_id: string;
  content: string;
}

interface ListMessagesResponse {
  messages: Message[];
}

// Sends a direct message to another user.
export const sendMessage = api<SendMessageRequest, Message>(
  { auth: true, expose: true, method: "POST", path: "/community/messages" },
  async (req) => {
    const auth = getAuthData()!;
    const { recipient_id, content } = req;

    const message = await communityDB.queryRow<{
      id: string;
      sender_id: string;
      recipient_id: string;
      content: string;
      read_at: Date | null;
      created_at: Date;
    }>`
      INSERT INTO messages (sender_id, recipient_id, content)
      VALUES (${auth.userID}, ${recipient_id}, ${content})
      RETURNING id, sender_id, recipient_id, content, read_at, created_at
    `;

    if (!message) {
      throw APIError.internal("failed to send message");
    }

    return {
      ...message,
      sender_username: auth.username,
      recipient_username: `User_${recipient_id.substring(0, 8)}`,
    };
  }
);

// Retrieves messages for the current user.
export const listMessages = api<void, ListMessagesResponse>(
  { auth: true, expose: true, method: "GET", path: "/community/messages" },
  async () => {
    const auth = getAuthData()!;

    const messages = await communityDB.queryAll<{
      id: string;
      sender_id: string;
      recipient_id: string;
      content: string;
      read_at: Date | null;
      created_at: Date;
    }>`
      SELECT id, sender_id, recipient_id, content, read_at, created_at
      FROM messages
      WHERE sender_id = ${auth.userID} OR recipient_id = ${auth.userID}
      ORDER BY created_at DESC
    `;

    // Add placeholder usernames since we can't join across databases
    const messagesWithUsernames: Message[] = messages.map(message => ({
      ...message,
      sender_username: message.sender_id === auth.userID ? auth.username : `User_${message.sender_id.substring(0, 8)}`,
      recipient_username: message.recipient_id === auth.userID ? auth.username : `User_${message.recipient_id.substring(0, 8)}`,
    }));

    return { messages: messagesWithUsernames };
  }
);

// Marks a message as read.
export const markMessageRead = api<{ id: string }, void>(
  { auth: true, expose: true, method: "PUT", path: "/community/messages/:id/read" },
  async ({ id }) => {
    const auth = getAuthData()!;

    await communityDB.exec`
      UPDATE messages 
      SET read_at = NOW()
      WHERE id = ${id} AND recipient_id = ${auth.userID}
    `;
  }
);
