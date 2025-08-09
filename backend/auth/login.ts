import { api, APIError } from "encore.dev/api";
import * as crypto from "crypto";
import { authDB } from "./db";

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
  };
  token: string;
}

// Logs in a user with email and password.
export const login = api<LoginRequest, LoginResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
  async (req) => {
    const { email, password } = req;

    // Hash the provided password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Find user with matching email and password
    const user = await authDB.queryRow<{
      id: string;
      email: string;
      username: string;
    }>`
      SELECT id, email, username
      FROM users 
      WHERE email = ${email} AND password_hash = ${passwordHash}
    `;

    if (!user) {
      throw APIError.unauthenticated("invalid email or password");
    }

    // Generate new session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Update user's session token
    await authDB.exec`
      UPDATE users 
      SET session_token = ${sessionToken}, updated_at = NOW()
      WHERE id = ${user.id}
    `;

    return {
      user,
      token: sessionToken,
    };
  }
);
