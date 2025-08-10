import { api, APIError } from "encore.dev/api";
import { db } from "./db";
import { sendToUser } from "./user_events";
import type { Call } from "./types";

interface InitiateCallRequest {
  threadId: string;
  receiverId: string;
  type: 'voice' | 'video';
}

interface InitiateCallResponse {
  call: Call;
}

// Initiates a call.
export const initiateCall = api<InitiateCallRequest, InitiateCallResponse>(
  { expose: true, method: "POST", path: "/messenger/calls/initiate" },
  async ({ threadId, receiverId, type }) => {
    const callerId = "00000000-0000-0000-0000-000000000000"; // default user

    const call = await db.queryRow<Call>`
      INSERT INTO call_history (thread_id, caller_id, receiver_id, type)
      VALUES (${threadId}, ${callerId}, ${receiverId}, ${type})
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
    let query = `UPDATE call_history SET status = ${status}`;
    if (status === 'answered') {
      query += `, started_at = NOW()`;
    } else if (status === 'ended') {
      query += `, ended_at = NOW(), duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER`;
    }
    query += ` WHERE id = ${callId} RETURNING *`;

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
