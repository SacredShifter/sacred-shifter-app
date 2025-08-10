import { api } from "encore.dev/api";
import { SocialService } from "./service";
import type {
  SocialComment,
  CreateCommentRequest,
  ListCommentsResponse
} from "./types";

const socialService = new SocialService();

// Creates a new comment on a post.
export const createComment = api<CreateCommentRequest, SocialComment>(
  { expose: true, method: "POST", path: "/social/comments" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await socialService.createComment(userId, req);
  }
);

// Lists comments for a post.
export const listComments = api<{ post_id: string }, ListCommentsResponse>(
  { expose: true, method: "GET", path: "/social/posts/:post_id/comments" },
  async ({ post_id }) => {
    const userId = "default-user"; // Use default user since no auth
    return await socialService.listComments(post_id, userId);
  }
);
