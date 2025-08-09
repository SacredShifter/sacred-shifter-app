import { api, APIError } from "encore.dev/api";
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
  { expose: true, method: "POST", path: "/community/messages" },
  async (req) => {
    const { recipient_id, content } = req;
    const userId = "default-user"; // Use default user since no auth
    const username = "Sacred Seeker"; // Use default username since no auth

    const message = await communityDB.queryRow<{
      id: string;
      sender_id: string;
      recipient_id: string;
      content: string;
      read_at: Date | null;
      created_at: Date;
    }>`
      INSERT INTO messages (sender_id, recipient_id, content)
      VALUES (${userId}, ${recipient_id}, ${content})
      RETURNING id, sender_id, recipient_id, content, read_at, created_at
    `;

    if (!message) {
      throw APIError.internal("failed to send message");
    }

    return {
      ...message,
      sender_username: username,
      recipient_username: "Sacred Seeker",
    };
  }
);

// Retrieves messages for the current user.
export const listMessages = api<void, ListMessagesResponse>(
  { expose: true, method: "GET", path: "/community/messages" },
  async () => {
    const userId = "default-user"; // Use default user since no auth
    const username = "Sacred Seeker"; // Use default username since no auth

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
      WHERE sender_id = ${userId} OR recipient_id = ${userId}
      ORDER BY created_at DESC
    `;

    // Add default usernames since no auth
    const messagesWithUsernames: Message[] = messages.map(message => ({
      ...message,
      sender_username: username,
      recipient_username: username,
    }));

    return { messages: messagesWithUsernames };
  }
);

// Marks a message as read.
export const markMessageRead = api<{ id: string }, void>(
  { expose: true, method: "PUT", path: "/community/messages/:id/read" },
  async ({ id }) => {
    const userId = "default-user"; // Use default user since no auth

    await communityDB.exec`
      UPDATE messages 
      SET read_at = NOW()
      WHERE id = ${id} AND recipient_id = ${userId}
    `;
  }
);
