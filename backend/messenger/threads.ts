import { api, APIError } from "encore.dev/api";
import { db } from "./db";
import type { Thread } from "./types";

interface ListThreadsResponse {
  threads: Thread[];
}

// Lists all threads for the current user.
export const listThreads = api<void, ListThreadsResponse>(
  { expose: true, method: "GET", path: "/messenger/threads" },
  async () => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user

    const threads = await db.rawQueryAll<Thread>`
      WITH last_messages AS (
        SELECT 
          thread_id, 
          body, 
          created_at,
          ROW_NUMBER() OVER(PARTITION BY thread_id ORDER BY created_at DESC) as rn
        FROM messages
      )
      SELECT
        t.id,
        t.is_group,
        t.title,
        t.created_at,
        (
          SELECT json_agg(json_build_object(
            'user_id', p.user_id, 
            'display_name', p.display_name,
            'avatar_url', p.avatar_url
          ))
          FROM thread_members tm
          JOIN social_profiles p ON tm.user_id = p.user_id
          WHERE tm.thread_id = t.id
        ) as members,
        lm.body as last_message,
        lm.created_at as last_message_created_at,
        (
          SELECT COUNT(*)
          FROM messages m
          WHERE m.thread_id = t.id AND m.created_at > tm_self.last_read_at
        ) as unread_count
      FROM threads t
      JOIN thread_members tm_self ON t.id = tm_self.thread_id
      LEFT JOIN last_messages lm ON t.id = lm.thread_id AND lm.rn = 1
      WHERE tm_self.user_id = ${userId}
      ORDER BY lm.created_at DESC NULLS LAST, t.created_at DESC
    `;

    return { threads };
  }
);

// Gets a single thread by ID.
export const get = api<{ threadId: string }, { thread: Thread }>(
  { expose: true, method: "GET", path: "/messenger/threads/:threadId" },
  async ({ threadId }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user
    const thread = await db.rawQueryRow<Thread>`
      SELECT
        t.id,
        t.is_group,
        t.title,
        t.created_at,
        (
          SELECT json_agg(json_build_object(
            'user_id', p.user_id, 
            'display_name', p.display_name,
            'avatar_url', p.avatar_url,
            'role', tm.role,
            'last_read_at', tm.last_read_at
          ))
          FROM thread_members tm
          JOIN social_profiles p ON tm.user_id = p.user_id
          WHERE tm.thread_id = t.id
        ) as members
      FROM threads t
      WHERE t.id = ${threadId}
    `;
    if (!thread) {
      throw APIError.notFound("thread not found");
    }
    return { thread };
  }
);

interface StartThreadRequest {
  memberIds: string[];
  title?: string;
}

// Starts a new thread.
export const start = api<StartThreadRequest, { threadId: string }>(
  { expose: true, method: "POST", path: "/messenger/threads" },
  async ({ memberIds, title }) => {
    const createdBy = "00000000-0000-0000-0000-000000000000"; // default user
    const allMemberIds = Array.from(new Set([...memberIds, createdBy]));
    const isGroup = allMemberIds.length > 2;

    // If it's a DM, check if a thread already exists
    if (!isGroup && allMemberIds.length === 2) {
      const existingThread = await db.queryRow<{ id: string }>`
        SELECT tm1.thread_id as id
        FROM thread_members tm1
        JOIN thread_members tm2 ON tm1.thread_id = tm2.thread_id
        JOIN threads t ON t.id = tm1.thread_id
        WHERE tm1.user_id = ${allMemberIds[0]}
          AND tm2.user_id = ${allMemberIds[1]}
          AND t.is_group = false
      `;
      if (existingThread) {
        return { threadId: existingThread.id };
      }
    }

    const thread = await db.queryRow<{ id: string }>`
      INSERT INTO threads (created_by, is_group, title)
      VALUES (${createdBy}, ${isGroup}, ${title})
      RETURNING id
    `;

    if (!thread) {
      throw APIError.internal("failed to create thread");
    }

    for (const memberId of allMemberIds) {
      const role = memberId === createdBy ? 'owner' : 'member';
      await db.exec`
        INSERT INTO thread_members (thread_id, user_id, role)
        VALUES (${thread.id}, ${memberId}, ${role})
      `;
    }

    return { threadId: thread.id };
  }
);

// Adds members to a thread.
export const addMembers = api<{ threadId: string; userIds: string[] }, void>(
  { expose: true, method: "POST", path: "/messenger/threads/:threadId/members" },
  async ({ threadId, userIds }) => {
    for (const userId of userIds) {
      await db.exec`
        INSERT INTO thread_members (thread_id, user_id, role)
        VALUES (${threadId}, ${userId}, 'member')
        ON CONFLICT DO NOTHING
      `;
    }
  }
);

// Leaves a thread.
export const leave = api<{ threadId: string }, void>(
  { expose: true, method: "DELETE", path: "/messenger/threads/:threadId/members/self" },
  async ({ threadId }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user
    await db.exec`
      DELETE FROM thread_members
      WHERE thread_id = ${threadId} AND user_id = ${userId}
    `;
  }
);

// Renames a thread.
export const rename = api<{ threadId: string; title: string }, void>(
  { expose: true, method: "PUT", path: "/messenger/threads/:threadId/rename" },
  async ({ threadId, title }) => {
    await db.exec`
      UPDATE threads
      SET title = ${title}
      WHERE id = ${threadId}
    `;
  }
);
