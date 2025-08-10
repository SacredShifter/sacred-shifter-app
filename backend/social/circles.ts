import { api, APIError } from "encore.dev/api";
import { socialDB } from "./db";
import type { SocialCircle } from "./types";

interface CreateCircleRequest {
  name: string;
  description?: string;
  is_public: boolean;
}

// Creates a new circle.
export const createCircle = api<CreateCircleRequest, { circle: SocialCircle }>(
  { expose: true, method: "POST", path: "/social/circles" },
  async (req) => {
    const ownerId = "00000000-0000-0000-0000-000000000000"; // default user
    
    const circle = await socialDB.queryRow<SocialCircle>`
      INSERT INTO social_circles (owner_id, name, description, is_public)
      VALUES (${ownerId}, ${req.name}, ${req.description}, ${req.is_public})
      RETURNING *
    `;
    if (!circle) {
      throw APIError.internal("failed to create circle");
    }

    // Add owner as member
    await socialDB.exec`
      INSERT INTO social_circle_members (circle_id, user_id, role)
      VALUES (${circle.id}, ${ownerId}, 'owner')
    `;
    
    const owner = await socialDB.queryRow`SELECT * FROM social_profiles WHERE user_id = ${ownerId}`;

    return { circle: { ...circle, is_member: true, owner: owner as any } };
  }
);

interface ListCirclesResponse {
  circles: SocialCircle[];
}

// Lists all circles.
export const listCircles = api<void, ListCirclesResponse>(
  { expose: true, method: "GET", path: "/social/circles" },
  async () => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user
    
    const circles = await socialDB.rawQueryAll<SocialCircle>(`
      SELECT
        c.*,
        EXISTS(SELECT 1 FROM social_circle_members WHERE circle_id = c.id AND user_id = $1) as is_member,
        row_to_json(o) as owner
      FROM social_circles c
      JOIN social_profiles o ON c.owner_id = o.user_id
      ORDER BY c.created_at DESC
    `, userId);

    return { circles };
  }
);

interface JoinLeaveCircleRequest {
  circleId: string;
}

// Joins a circle.
export const joinCircle = api<JoinLeaveCircleRequest, void>(
  { expose: true, method: "POST", path: "/social/circles/:circleId/join" },
  async ({ circleId }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user
    await socialDB.exec`
      INSERT INTO social_circle_members (circle_id, user_id, role)
      VALUES (${circleId}, ${userId}, 'member')
      ON CONFLICT DO NOTHING
    `;
  }
);

// Leaves a circle.
export const leaveCircle = api<JoinLeaveCircleRequest, void>(
  { expose: true, method: "POST", path: "/social/circles/:circleId/leave" },
  async ({ circleId }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user
    await socialDB.exec`
      DELETE FROM social_circle_members
      WHERE circle_id = ${circleId} AND user_id = ${userId}
    `;
  }
);
