import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { communityDB } from "./db";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const usersDB = SQLDatabase.named("sacred_shifter");

export interface SharedLearning {
  id: string;
  user_id: string;
  username: string;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

interface CreateSharedLearningRequest {
  title: string;
  content: string;
}

interface ListSharedLearningsResponse {
  learnings: SharedLearning[];
}

// Creates a new shared learning post.
export const createSharedLearning = api<CreateSharedLearningRequest, SharedLearning>(
  { auth: true, expose: true, method: "POST", path: "/community/shared-learnings" },
  async (req) => {
    const auth = getAuthData()!;
    const { title, content } = req;

    const learning = await communityDB.queryRow<{
      id: string;
      user_id: string;
      title: string;
      content: string;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO shared_learnings (user_id, title, content)
      VALUES (${auth.userID}, ${title}, ${content})
      RETURNING id, user_id, title, content, created_at, updated_at
    `;

    if (!learning) {
      throw APIError.internal("failed to create shared learning");
    }

    return {
      ...learning,
      username: auth.username,
    };
  }
);

// Retrieves all shared learning posts.
export const listSharedLearnings = api<void, ListSharedLearningsResponse>(
  { expose: true, method: "GET", path: "/community/shared-learnings" },
  async () => {
    const learnings = await communityDB.queryAll<SharedLearning>`
      SELECT 
        sl.id, 
        sl.user_id, 
        u.username,
        sl.title, 
        sl.content, 
        sl.created_at, 
        sl.updated_at
      FROM shared_learnings sl
      LEFT JOIN users u ON sl.user_id = u.id
      ORDER BY sl.created_at DESC
    `;

    return { learnings };
  }
);
