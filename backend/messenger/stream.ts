import { api, StreamInOut } from "encore.dev/api";
import type { Message } from "./types";

// In-memory store of active streams, keyed by thread ID.
// This is not scalable across multiple service replicas without a distributed cache like Redis.
// For this implementation, we assume a single replica or that stickiness is handled.
const streamsByThread = new Map<string, Set<StreamInOut<IncomingEvent, OutgoingEvent>>>();

interface Handshake {
  threadId: string;
}

interface IncomingEvent {
  type: 'typing';
  payload: { isTyping: boolean };
}

export interface OutgoingEvent {
  type: 'newMessage' | 'messageUpdated' | 'messageDeleted' | 'presence';
  payload: any;
}

// Real-time event stream for messenger
export const events = api.streamInOut<Handshake, IncomingEvent, OutgoingEvent>(
  { expose: true, path: "/messenger/events" },
  async (handshake, stream) => {
    const { threadId } = handshake;
    const userId = "00000000-0000-0000-0000-000000000000"; // default user

    // Add stream to the map
    if (!streamsByThread.has(threadId)) {
      streamsByThread.set(threadId, new Set());
    }
    streamsByThread.get(threadId)!.add(stream);

    // Broadcast presence
    broadcastToThread(threadId, {
      type: 'presence',
      payload: { userId, status: 'online' },
    });

    try {
      for await (const event of stream) {
        if (event.type === 'typing') {
          broadcastToThread(threadId, {
            type: 'presence',
            payload: { userId, status: 'typing', isTyping: event.payload.isTyping },
          }, stream); // Exclude self
        }
      }
    } finally {
      // Remove stream from map on disconnect
      const streams = streamsByThread.get(threadId);
      if (streams) {
        streams.delete(stream);
        if (streams.size === 0) {
          streamsByThread.delete(threadId);
        }
      }
      // Broadcast presence
      broadcastToThread(threadId, {
        type: 'presence',
        payload: { userId, status: 'offline' },
      });
    }
  }
);

// Function to broadcast messages to a thread
export function broadcastToThread(threadId: string, event: OutgoingEvent, exclude?: StreamInOut<any, any>) {
  const streams = streamsByThread.get(threadId);
  if (streams) {
    for (const stream of streams) {
      if (stream !== exclude) {
        stream.send(event).catch(() => {
          // Remove stream if sending fails
          streams.delete(stream);
        });
      }
    }
  }
}
