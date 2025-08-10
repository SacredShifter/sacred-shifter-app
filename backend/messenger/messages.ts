import { api, APIError } from "encore.dev/api";
import { db } from "./db";
import { broadcastToThread } from "./stream";
import type { Message, MessageContent } from "./types";

interface ListMessagesRequest {
  threadId: string;
}

interface ListMessagesResponse {
  messages: Message[];
}

// Lists messages for a thread.
export const listMessages = api<ListMessagesRequest, ListMessagesResponse>(
  { expose: true, method: "GET", path: "/messenger/threads/:threadId/messages" },
  async ({ threadId }) => {
    const messages = await db.rawQueryAll<Message>`
      SELECT
        m.id, m.thread_id, m.sender_id, m.body, m.content, m.created_at, m.edited_at, m.reply_to_id,
        row_to_json(s) as sender,
        (
          SELECT row_to_json(rm) FROM (
            SELECT
              rm_inner.id, rm_inner.body,
              row_to_json(rms) as sender
            FROM messages rm_inner
            JOIN social_profiles rms ON rm_inner.sender_id = rms.user_id
            WHERE rm_inner.id = m.reply_to_id
          ) rm
        ) as reply_to
      FROM messages m
      JOIN social_profiles s ON m.sender_id = s.user_id
      WHERE m.thread_id = ${threadId}
      ORDER BY m.created_at ASC
      LIMIT 100
    `;
    return { messages };
  }
);

interface SendMessageRequest {
  threadId: string;
  body: string;
  content?: MessageContent;
  replyToId?: string;
}

interface SendMessageResponse {
  message: Message;
}

// Sends a new message.
export const send = api<SendMessageRequest, SendMessageResponse>(
  { expose: true, method: "POST", path: "/messenger/messages" },
  async (req) => {
    const senderId = "00000000-0000-0000-0000-000000000000"; // default user

    const message = await db.queryRow<Message>`
      INSERT INTO messages (thread_id, sender_id, body, content, reply_to_id)
      VALUES (${req.threadId}, ${senderId}, ${req.body}, ${JSON.stringify(req.content || {})}, ${req.replyToId})
      RETURNING id, thread_id, sender_id, body, content, created_at, edited_at, reply_to_id
    `;

    if (!message) {
      throw APIError.internal("failed to send message");
    }

    // Broadcast the new message to connected clients
    broadcastToThread(req.threadId, {
      type: 'newMessage',
      payload: message,
    });

    return { message };
  }
);

interface EditMessageRequest {
  messageId: string;
  body: string;
  content?: MessageContent;
}

// Edits an existing message.
export const edit = api<EditMessageRequest, { message: Message }>(
  { expose: true, method: "PUT", path: "/messenger/messages/:messageId" },
  async ({ messageId, body, content }) => {
    const senderId = "00000000-0000-0000-0000-000000000000"; // default user

    const message = await db.queryRow<Message>`
      UPDATE messages
      SET
        body = ${body},
        content = ${JSON.stringify(content || {})},
        edited_at = NOW()
      WHERE id = ${messageId} AND sender_id = ${senderId}
      RETURNING id, thread_id, sender_id, body, content, created_at, edited_at, reply_to_id
    `;

    if (!message) {
      throw APIError.notFound("message not found or permission denied");
    }

    broadcastToThread(message.thread_id, {
      type: 'messageUpdated',
      payload: message,
    });

    return { message };
  }
);

// Deletes a message.
export const del = api<{ messageId: string }, void>(
  { expose: true, method: "DELETE", path: "/messenger/messages/:messageId" },
  async ({ messageId }) => {
    const senderId = "00000000-0000-0000-0000-000000000000"; // default user

    const res = await db.queryRow<{ thread_id: string }>`
      DELETE FROM messages
      WHERE id = ${messageId} AND sender_id = ${senderId}
      RETURNING thread_id
    `;

    if (res) {
      broadcastToThread(res.thread_id, {
        type: 'messageDeleted',
        payload: { id: messageId },
      });
    }
  }
);

// Marks a thread as read.
export const markAsRead = api<{ threadId: string }, void>(
  { expose: true, method: "POST", path: "/messenger/threads/:threadId/read" },
  async ({ threadId }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user
    await db.exec`
      UPDATE thread_members
      SET last_read_at = NOW()
      WHERE thread_id = ${threadId} AND user_id = ${userId}
    `;
  }
);
