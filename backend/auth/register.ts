import { api, APIError } from "encore.dev/api";
import * as crypto from "crypto";
import { db } from "./db";

interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    username: string;
  };
  token: string;
}

// Registers a new user account.
export const register = api<RegisterRequest, RegisterResponse>(
  { expose: true, method: "POST", path: "/auth/register" },
  async (req) => {
    const { email, username, password } = req;

    // Check if user already exists
    const existingUser = await db.queryRow`
      SELECT id FROM users WHERE email = ${email} OR username = ${username}
    `;

    if (existingUser) {
      throw APIError.alreadyExists("user with this email or username already exists");
    }

    // Hash password
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    
    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await db.queryRow<{
      id: string;
      email: string;
      username: string;
    }>`
      INSERT INTO users (email, username, password_hash, session_token)
      VALUES (${email}, ${username}, ${passwordHash}, ${sessionToken})
      RETURNING id, email, username
    `;

    if (!user) {
      throw APIError.internal("failed to create user");
    }

    return {
      user,
      token: sessionToken,
    };
  }
);
