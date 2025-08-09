import { api, APIError } from "encore.dev/api";
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
  { expose: true, method: "POST", path: "/community/shared-learnings" },
  async (req) => {
    const { title, content } = req;
    const userId = "default-user"; // Use default user since no auth
    const username = "Sacred Seeker"; // Use default username since no auth

    const learning = await communityDB.queryRow<{
      id: string;
      user_id: string;
      title: string;
      content: string;
      created_at: Date;
      updated_at: Date;
    }>`
      INSERT INTO shared_learnings (user_id, title, content)
      VALUES (${userId}, ${title}, ${content})
      RETURNING id, user_id, title, content, created_at, updated_at
    `;

    if (!learning) {
      throw APIError.internal("failed to create shared learning");
    }

    return {
      ...learning,
      username,
    };
  }
);

// Retrieves all shared learning posts.
export const listSharedLearnings = api<void, ListSharedLearningsResponse>(
  { expose: true, method: "GET", path: "/community/shared-learnings" },
  async () => {
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

    // Add default username since no auth
    const learningsWithUsernames: SharedLearning[] = learnings.map(learning => ({
      ...learning,
      username: "Sacred Seeker"
    }));

    return { learnings: learningsWithUsernames };
  }
);
