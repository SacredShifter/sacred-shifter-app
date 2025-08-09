import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { communityDB } from "./db";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const usersDB = SQLDatabase.named("sacred_shifter");

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

    // Verify recipient exists
    const recipient = await usersDB.queryRow<{ username: string }>`
      SELECT username FROM users WHERE id = ${recipient_id}
    `;

    if (!recipient) {
      throw APIError.notFound("recipient not found");
    }

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
      recipient_username: recipient.username,
    };
  }
);

// Retrieves messages for the current user.
export const listMessages = api<void, ListMessagesResponse>(
  { auth: true, expose: true, method: "GET", path: "/community/messages" },
  async () => {
    const auth = getAuthData()!;

    const messages = await communityDB.rawQueryAll<{
      id: string;
      sender_id: string;
      sender_username: string;
      recipient_id: string;
      recipient_username: string;
      content: string;
      read_at: Date | null;
      created_at: Date;
    }>(`
      SELECT 
        m.id,
        m.sender_id,
        s.username as sender_username,
        m.recipient_id,
        r.username as recipient_username,
        m.content,
        m.read_at,
        m.created_at
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.recipient_id = r.id
      WHERE m.sender_id = $1 OR m.recipient_id = $1
      ORDER BY m.created_at DESC
    `, auth.userID);

    return { messages };
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
