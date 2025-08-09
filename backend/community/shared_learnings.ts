import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { communityDB } from "./db";

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
    // Since we can't do cross-database JOINs, we'll get the learnings first
    // and then fetch usernames separately
    const learnings = await communityDB.queryAll<{
      id: string;
      user_id: string;
      title: string;
      content: string;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, user_id, title, content, created_at, updated_at
      FROM shared_learnings
      ORDER BY created_at DESC
    `;

    // For now, we'll use a placeholder username since we can't easily join across databases
    // In a real implementation, you'd want to either:
    // 1. Store username in the shared_learnings table
    // 2. Make a separate API call to get usernames
    // 3. Use a single database for both users and community data
    const learningsWithUsernames: SharedLearning[] = learnings.map(learning => ({
      ...learning,
      username: `User_${learning.user_id.substring(0, 8)}`
    }));

    return { learnings: learningsWithUsernames };
  }
);
