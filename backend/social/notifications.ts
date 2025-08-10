import { api, APIError } from "encore.dev/api";
import { socialDB } from "./db";

export interface SocialNotification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'post_share';
  actor_id: string | null;
  target_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: Date;
  actor?: {
    user_id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  target_post?: {
    id: string;
    content: string;
  };
}

interface ListNotificationsRequest {
  limit?: number;
  offset?: number;
  unread_only?: boolean;
}

interface ListNotificationsResponse {
  notifications: SocialNotification[];
  total: number;
  unread_count: number;
  has_more: boolean;
}

interface MarkNotificationRequest {
  notificationId: string;
}

// Lists notifications for the current user.
export const listNotifications = api<ListNotificationsRequest, ListNotificationsResponse>(
  { expose: true, method: "GET", path: "/social/notifications" },
  async ({ limit = 50, offset = 0, unread_only = false }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user

    let whereClause = "n.user_id = $1";
    const params: any[] = [userId];
    let paramIndex = 2;

    if (unread_only) {
      whereClause += ` AND n.is_read = false`;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN is_read = false THEN 1 END) as unread_count
      FROM social_notifications n
      WHERE ${whereClause}
    `;
    
    const countResult = await socialDB.rawQueryRow<{ total: number; unread_count: number }>(
      countQuery, 
      ...params
    );
    
    const total = countResult?.total || 0;
    const unreadCount = countResult?.unread_count || 0;

    // Get notifications with actor and target post info
    const notificationsQuery = `
      SELECT 
        n.*,
        row_to_json(actor) as actor,
        CASE 
          WHEN n.type IN ('like', 'comment', 'post_share') THEN
            json_build_object(
              'id', p.id,
              'content', LEFT(p.content, 100)
            )
          ELSE NULL
        END as target_post
      FROM social_notifications n
      LEFT JOIN social_profiles actor ON n.actor_id = actor.user_id
      LEFT JOIN social_posts p ON n.target_id = p.id AND n.type IN ('like', 'comment', 'post_share')
      WHERE ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const notifications = await socialDB.rawQueryAll<SocialNotification>(
      notificationsQuery,
      ...params,
      limit,
      offset
    );

    return {
      notifications: notifications || [],
      total,
      unread_count: unreadCount,
      has_more: offset + limit < total
    };
  }
);

// Marks a notification as read.
export const markNotificationAsRead = api<MarkNotificationRequest, void>(
  { expose: true, method: "PUT", path: "/social/notifications/:notificationId/read" },
  async ({ notificationId }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user

    const result = await socialDB.exec`
      UPDATE social_notifications 
      SET is_read = true 
      WHERE id = ${notificationId} AND user_id = ${userId}
    `;
  }
);

// Marks all notifications as read.
export const markAllNotificationsAsRead = api<void, void>(
  { expose: true, method: "PUT", path: "/social/notifications/read-all" },
  async () => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user

    await socialDB.exec`
      UPDATE social_notifications 
      SET is_read = true 
      WHERE user_id = ${userId} AND is_read = false
    `;
  }
);

// Deletes a notification.
export const deleteNotification = api<MarkNotificationRequest, void>(
  { expose: true, method: "DELETE", path: "/social/notifications/:notificationId" },
  async ({ notificationId }) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user

    await socialDB.exec`
      DELETE FROM social_notifications 
      WHERE id = ${notificationId} AND user_id = ${userId}
    `;
  }
);

// Gets notification counts.
export const getNotificationCounts = api<void, { total: number; unread: number }>(
  { expose: true, method: "GET", path: "/social/notifications/counts" },
  async () => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user

    const counts = await socialDB.queryRow<{ total: number; unread: number }>`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_read = false THEN 1 END) as unread
      FROM social_notifications
      WHERE user_id = ${userId}
    `;

    return counts || { total: 0, unread: 0 };
  }
);

// Creates a notification (internal function, not exposed as API)
export async function createNotification(
  userId: string,
  type: 'like' | 'comment' | 'follow' | 'mention' | 'post_share',
  actorId: string,
  targetId?: string,
  content?: string
): Promise<void> {
  // Don't create notification if actor is the same as the recipient
  if (userId === actorId) {
    return;
  }

  await socialDB.exec`
    INSERT INTO social_notifications (user_id, type, actor_id, target_id, content)
    VALUES (${userId}, ${type}, ${actorId}, ${targetId}, ${content})
  `;
}
