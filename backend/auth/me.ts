import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";

interface UserInfo {
  id: string;
  email: string;
  username: string;
}

// Gets the current user's information.
export const me = api<void, UserInfo>(
  { auth: true, expose: true, method: "GET", path: "/auth/me" },
  async () => {
    const auth = getAuthData()!;
    return {
      id: auth.userID,
      email: auth.email,
      username: auth.username,
    };
  }
);
