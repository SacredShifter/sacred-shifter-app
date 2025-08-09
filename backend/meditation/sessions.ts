import { api } from "encore.dev/api";
import { MeditationService } from "./service";
import type { 
  MeditationSession,
  StartSessionRequest,
  EndSessionRequest,
  ListSessionsRequest,
  ListSessionsResponse,
  CurrentSessionResponse
} from "./types";

const meditationService = new MeditationService();

// Starts a new meditation session.
export const startSession = api<StartSessionRequest, MeditationSession>(
  { expose: true, method: "POST", path: "/meditation/sessions/start" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await meditationService.startSession(userId, req);
  }
);

// Ends a meditation session and marks it as completed.
export const endSession = api<EndSessionRequest, MeditationSession>(
  { expose: true, method: "PUT", path: "/meditation/sessions/:id/end" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await meditationService.endSession(userId, req);
  }
);

// Gets the current active session for the user.
export const getCurrentSession = api<void, CurrentSessionResponse>(
  { expose: true, method: "GET", path: "/meditation/sessions/current" },
  async () => {
    const userId = "default-user"; // Use default user since no auth
    return await meditationService.getCurrentSession(userId);
  }
);

// Retrieves meditation sessions for the current user.
export const listSessions = api<ListSessionsRequest, ListSessionsResponse>(
  { expose: true, method: "GET", path: "/meditation/sessions" },
  async (req) => {
    const userId = "default-user"; // Use default user since no auth
    return await meditationService.listSessions(userId, req);
  }
);
