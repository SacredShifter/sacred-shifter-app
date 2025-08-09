import { authHandler } from "encore.dev/auth";
import { Header, Cookie, APIError, Gateway } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("sacred_shifter", {
  migrations: "./migrations",
});

interface AuthParams {
  authorization?: Header<"Authorization">;
  session?: Cookie<"session">;
}

export interface AuthData {
  userID: string;
  email: string;
  username: string;
}

const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "") ?? data.session?.value;
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }

    try {
      const user = await db.queryRow<{
        id: string;
        email: string;
        username: string;
        session_token: string;
      }>`
        SELECT id, email, username, session_token 
        FROM users 
        WHERE session_token = ${token}
      `;

      if (!user) {
        throw APIError.unauthenticated("invalid token");
      }

      return {
        userID: user.id,
        email: user.email,
        username: user.username,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err);
    }
  }
);

export const gw = new Gateway({ authHandler: auth });
