import { api } from "encore.dev/api";
import { SocialService } from "./service";
import type {
  SocialProfile,
  UpdateProfileRequest
} from "./types";

const socialService = new SocialService();

// Gets or creates the current user's profile.
export const getProfile = api<void, SocialProfile>(
  { expose: true, method: "GET", path: "/social/profile" },
  async () => {
    const userId = "default-user"; // Use default user since no auth
    return await socialService.getOrCreateProfile(userId);
  }
);

// Updates the current user's profile.
export const updateProfile = api<UpdateProfileRequest, SocialProfile>(
  { expose: true, method: "PUT", path: "/social/profile" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await socialService.updateProfile(userId, req);
  }
);
