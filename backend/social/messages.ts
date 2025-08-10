import { api } from "encore.dev/api";
import { SocialService } from "./service";
import type {
  SocialMessage,
  SendMessageRequest,
  ListMessagesResponse
} from "./types";

const socialService = new SocialService();

// Sends a direct message.
export const sendMessage = api<SendMessageRequest, SocialMessage>(
  { expose: true, method: "POST", path: "/social/messages" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await socialService.sendMessage(userId, req);
  }
);

// Lists messages for the current user.
export const listMessages = api<void, ListMessagesResponse>(
  { expose: true, method: "GET", path: "/social/messages" },
  async () => {
    const userId = "default-user"; // Use default user since no auth
    return await socialService.listMessages(userId);
  }
);
