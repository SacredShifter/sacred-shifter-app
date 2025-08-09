import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { meditationDB } from "./db";

export interface MeditationSession {
  id: string;
  user_id: string;
  soundscape: string;
  duration_seconds: number | null;
  completed: boolean;
  started_at: Date;
  ended_at: Date | null;
  created_at: Date;
}

interface StartSessionRequest {
  soundscape: string;
}

interface EndSessionRequest {
  id: string;
}

interface ListSessionsResponse {
  sessions: MeditationSession[];
}

interface CurrentSessionResponse {
  session: MeditationSession | null;
}

// Starts a new meditation session.
export const startSession = api<StartSessionRequest, MeditationSession>(
  { auth: true, expose: true, method: "POST", path: "/meditation/sessions/start" },
  async (req) => {
    const auth = getAuthData()!;
    const { soundscape } = req;

    const session = await meditationDB.queryRow<MeditationSession>`
      INSERT INTO meditation_sessions (user_id, soundscape)
      VALUES (${auth.userID}, ${soundscape})
      RETURNING id, user_id, soundscape, duration_seconds, completed, started_at, ended_at, created_at
    `;

    if (!session) {
      throw APIError.internal("failed to start meditation session");
    }

    return session;
  }
);

// Ends a meditation session and marks it as completed.
export const endSession = api<EndSessionRequest, MeditationSession>(
  { auth: true, expose: true, method: "PUT", path: "/meditation/sessions/:id/end" },
  async (req) => {
    const auth = getAuthData()!;
    const { id } = req;

    const session = await meditationDB.queryRow<MeditationSession>`
      UPDATE meditation_sessions
      SET 
        ended_at = NOW(),
        completed = TRUE,
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
      WHERE id = ${id} AND user_id = ${auth.userID}
      RETURNING id, user_id, soundscape, duration_seconds, completed, started_at, ended_at, created_at
    `;

    if (!session) {
      throw APIError.notFound("meditation session not found");
    }

    return session;
  }
);

// Retrieves all meditation sessions for the current user.
export const listSessions = api<void, ListSessionsResponse>(
  { auth: true, expose: true, method: "GET", path: "/meditation/sessions" },
  async () => {
    const auth = getAuthData()!;

    const sessions = await meditationDB.queryAll<MeditationSession>`
      SELECT id, user_id, soundscape, duration_seconds, completed, started_at, ended_at, created_at
      FROM meditation_sessions
      WHERE user_id = ${auth.userID}
      ORDER BY started_at DESC
    `;

    return { sessions };
  }
);

// Gets the current active session for the user.
export const getCurrentSession = api<void, CurrentSessionResponse>(
  { auth: true, expose: true, method: "GET", path: "/meditation/sessions/current" },
  async () => {
    const auth = getAuthData()!;

    const session = await meditationDB.queryRow<MeditationSession>`
      SELECT id, user_id, soundscape, duration_seconds, completed, started_at, ended_at, created_at
      FROM meditation_sessions
      WHERE user_id = ${auth.userID} AND completed = FALSE
      ORDER BY started_at DESC
      LIMIT 1
    `;

    return { session };
  }
);
