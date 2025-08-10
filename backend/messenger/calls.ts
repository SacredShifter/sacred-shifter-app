import { api, APIError } from "encore.dev/api";
import { db } from "./db";
import { sendToUser } from "./user_events";
import type { Call } from "./types";
import { Bucket } from "encore.dev/storage/objects";
import { v4 as uuidv4 } from 'uuid';

const callRecordingsBucket = new Bucket("call-recordings", { public: true });

interface InitiateCallRequest {
  threadId: string;
  receiverId: string;
  type: 'voice' | 'video';
  sessionType?: string;
}

interface InitiateCallResponse {
  call: Call;
}

// Initiates a call.
export const initiateCall = api<InitiateCallRequest, InitiateCallResponse>(
  { expose: true, method: "POST", path: "/messenger/calls/initiate" },
  async ({ threadId, receiverId, type, sessionType = 'standard' }) => {
    const callerId = "00000000-0000-0000-0000-000000000000"; // default user

    const call = await db.queryRow<Call>`
      INSERT INTO call_history (thread_id, caller_id, receiver_id, type, session_type)
      VALUES (${threadId}, ${callerId}, ${receiverId}, ${type}, ${sessionType})
      RETURNING *
    `;

    if (!call) {
      throw APIError.internal("failed to initiate call");
    }

    // Notify receiver via user event stream
    sendToUser(receiverId, {
      type: 'incomingCall',
      payload: call,
    });

    return { call };
  }
);

interface UpdateCallStatusRequest {
  callId: string;
  status: 'answered' | 'declined' | 'ended';
}

// Updates the status of a call.
export const updateCallStatus = api<UpdateCallStatusRequest, { call: Call }>(
  { expose: true, method: "PUT", path: "/messenger/calls/:callId/status" },
  async ({ callId, status }) => {
    let query = `UPDATE call_history SET status = '${status}'`;
    if (status === 'answered') {
      query += `, started_at = NOW()`;
    } else if (status === 'ended') {
      query += `, ended_at = NOW(), duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER`;
    }
    query += ` WHERE id = '${callId}' RETURNING *`;

    const call = await db.queryRow<Call>(query);

    if (!call) {
      throw APIError.notFound("call not found");
    }

    // Notify participants of status change
    const { caller_id, receiver_id } = call;
    sendToUser(caller_id, { type: 'callStatusUpdate', payload: call });
    sendToUser(receiver_id, { type: 'callStatusUpdate', payload: call });

    return { call };
  }
);

interface ListCallHistoryResponse {
  calls: Call[];
}

// Lists call history for the current user.
export const listCallHistory = api<void, ListCallHistoryResponse>(
  { expose: true, method: "GET", path: "/messenger/calls/history" },
  async () => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user
    const calls = await db.queryAll<Call>`
      SELECT * FROM call_history
      WHERE caller_id = ${userId} OR receiver_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return { calls };
  }
);

interface GetUploadUrlRequest {
  callId: string;
  contentType: string;
}

interface GetUploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}

// Generates a signed URL for uploading a call recording.
export const getRecordingUploadUrl = api<GetUploadUrlRequest, GetUploadUrlResponse>(
  { expose: true, method: "POST", path: "/messenger/calls/:callId/recording-url" },
  async ({ callId, contentType }) => {
    const objectName = `recordings/${callId}.webm`;

    const { url } = await callRecordingsBucket.signedUploadUrl(objectName, {
      ttl: 3600, // 1 hour
      contentType: contentType,
    });

    return {
      uploadUrl: url,
      publicUrl: callRecordingsBucket.publicUrl(objectName),
    };
  }
);

interface SaveRecordingUrlRequest {
  callId: string;
  recordingUrl: string;
}

// Saves the URL of a call recording.
export const saveRecordingUrl = api<SaveRecordingUrlRequest, void>(
  { expose: true, method: "PUT", path: "/messenger/calls/:callId/recording" },
  async ({ callId, recordingUrl }) => {
    await db.exec`
      UPDATE call_history
      SET recording_url = ${recordingUrl}
      WHERE id = ${callId}
    `;
  }
);
