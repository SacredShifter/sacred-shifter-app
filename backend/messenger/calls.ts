import expressWs from 'express-ws';
import { Router } from 'express';
import { APIError } from "encore.dev/api";

const router = Router();
expressWs(router); // Enable WebSocket handling

// WebSocket connection handler
router.ws('/messenger/ws', (ws, req) => {
  ws.on('message', (msg) => {
    // Handle incoming messages
    console.log('Received message:', msg);
    ws.send(`Message received: ${msg}`); // Echo the message back for now
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

interface UpdateCallStatusRequest {
  callId: string;
  status: string;
}

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