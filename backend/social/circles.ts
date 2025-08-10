import { api } from "encore.dev/api";
import { SocialService } from "./service";
import type {
  SocialCircle,
  CreateCircleRequest,
  ListCirclesResponse
} from "./types";

const socialService = new SocialService();

// Creates a new circle.
export const createCircle = api<CreateCircleRequest, SocialCircle>(
  { expose: true, method: "POST", path: "/social/circles" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await socialService.createCircle(userId, req);
  }
);

// Lists all circles.
export const listCircles = api<void, ListCirclesResponse>(
  { expose: true, method: "GET", path: "/social/circles" },
  async () => {
    const userId = "default-user"; // Use default user since no auth
    return await socialService.listCircles(userId);
  }
);

// Joins a circle.
export const joinCircle = api<{ circle_id: string }, void>(
  { expose: true, method: "POST", path: "/social/circles/:circle_id/join" },
  async ({ circle_id }) => {
    const userId = "default-user"; // Use default user since no auth
    await socialService.joinCircle(userId, circle_id);
  }
);

// Leaves a circle.
export const leaveCircle = api<{ circle_id: string }, void>(
  { expose: true, method: "DELETE", path: "/social/circles/:circle_id/leave" },
  async ({ circle_id }) => {
    const userId = "default-user"; // Use default user since no auth
    await socialService.leaveCircle(userId, circle_id);
  }
);
