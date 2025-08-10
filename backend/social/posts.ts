import { api } from "encore.dev/api";
import { SocialService } from "./service";
import type {
  SocialPost,
  CreatePostRequest,
  ListPostsRequest,
  ListPostsResponse
} from "./types";

const socialService = new SocialService();

// Creates a new social post.
export const createPost = api<CreatePostRequest, SocialPost>(
  { expose: true, method: "POST", path: "/social/posts" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await socialService.createPost(userId, req);
  }
);

// Lists social posts.
export const listPosts = api<ListPostsRequest, ListPostsResponse>(
  { expose: true, method: "GET", path: "/social/posts" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await socialService.listPosts(userId, req);
  }
);

// Toggles like on a post.
export const toggleLike = api<{ post_id: string }, { liked: boolean; like_count: number }>(
  { expose: true, method: "POST", path: "/social/posts/:post_id/like" },
  async ({ post_id }) => {
    const userId = "default-user"; // Use default user since no auth
    return await socialService.toggleLike(userId, post_id);
  }
);
