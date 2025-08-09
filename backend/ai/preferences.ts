import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { aiDB } from "./db";

export interface AIUserPreferences {
  user_id: string;
  assistant_personality: string;
  preferred_response_style: string;
  dream_analysis_enabled: boolean;
  journal_assistance_enabled: boolean;
  meditation_guidance_enabled: boolean;
  admin_mode_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

interface UpdatePreferencesRequest {
  assistant_personality?: string;
  preferred_response_style?: string;
  dream_analysis_enabled?: boolean;
  journal_assistance_enabled?: boolean;
  meditation_guidance_enabled?: boolean;
}

// Retrieves the current user's AI assistant preferences.
export const getPreferences = api<void, AIUserPreferences>(
  { auth: true, expose: true, method: "GET", path: "/ai/preferences" },
  async () => {
    const auth = getAuthData()!;

    let preferences = await aiDB.queryRow<AIUserPreferences>`
      SELECT user_id, assistant_personality, preferred_response_style, 
             dream_analysis_enabled, journal_assistance_enabled, 
             meditation_guidance_enabled, admin_mode_enabled,
             created_at, updated_at
      FROM ai_user_preferences
      WHERE user_id = ${auth.userID}
    `;

    if (!preferences) {
      // Create default preferences
      preferences = await aiDB.queryRow<AIUserPreferences>`
        INSERT INTO ai_user_preferences (user_id)
        VALUES (${auth.userID})
        RETURNING user_id, assistant_personality, preferred_response_style, 
                  dream_analysis_enabled, journal_assistance_enabled, 
                  meditation_guidance_enabled, admin_mode_enabled,
                  created_at, updated_at
      `;

      if (!preferences) {
        throw APIError.internal("failed to create user preferences");
      }
    }

    return preferences;
  }
);

// Updates the current user's AI assistant preferences.
export const updatePreferences = api<UpdatePreferencesRequest, AIUserPreferences>(
  { auth: true, expose: true, method: "PUT", path: "/ai/preferences" },
  async (req) => {
    const auth = getAuthData()!;

    // Ensure preferences exist
    await aiDB.exec`
      INSERT INTO ai_user_preferences (user_id)
      VALUES (${auth.userID})
      ON CONFLICT (user_id) DO NOTHING
    `;

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (req.assistant_personality !== undefined) {
      updateFields.push(`assistant_personality = $${updateValues.length + 1}`);
      updateValues.push(req.assistant_personality);
    }

    if (req.preferred_response_style !== undefined) {
      updateFields.push(`preferred_response_style = $${updateValues.length + 1}`);
      updateValues.push(req.preferred_response_style);
    }

    if (req.dream_analysis_enabled !== undefined) {
      updateFields.push(`dream_analysis_enabled = $${updateValues.length + 1}`);
      updateValues.push(req.dream_analysis_enabled);
    }

    if (req.journal_assistance_enabled !== undefined) {
      updateFields.push(`journal_assistance_enabled = $${updateValues.length + 1}`);
      updateValues.push(req.journal_assistance_enabled);
    }

    if (req.meditation_guidance_enabled !== undefined) {
      updateFields.push(`meditation_guidance_enabled = $${updateValues.length + 1}`);
      updateValues.push(req.meditation_guidance_enabled);
    }

    if (updateFields.length === 0) {
      throw APIError.invalidArgument("no fields to update");
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(auth.userID);

    const query = `
      UPDATE ai_user_preferences
      SET ${updateFields.join(', ')}
      WHERE user_id = $${updateValues.length}
      RETURNING user_id, assistant_personality, preferred_response_style, 
                dream_analysis_enabled, journal_assistance_enabled, 
                meditation_guidance_enabled, admin_mode_enabled,
                created_at, updated_at
    `;

    const preferences = await aiDB.rawQueryRow<AIUserPreferences>(query, ...updateValues);

    if (!preferences) {
      throw APIError.internal("failed to update preferences");
    }

    return preferences;
  }
);

// Enables admin mode for the current user (restricted endpoint).
export const enableAdminMode = api<void, void>(
  { auth: true, expose: true, method: "POST", path: "/ai/admin/enable" },
  async () => {
    const auth = getAuthData()!;

    // In a real application, you would check if the user has admin privileges
    // For now, we'll allow any authenticated user to enable admin mode
    // You should implement proper admin role checking here

    await aiDB.exec`
      INSERT INTO ai_user_preferences (user_id, admin_mode_enabled)
      VALUES (${auth.userID}, TRUE)
      ON CONFLICT (user_id) 
      DO UPDATE SET admin_mode_enabled = TRUE, updated_at = NOW()
    `;
  }
);
