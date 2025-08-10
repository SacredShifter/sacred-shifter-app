import { api, StreamInOut } from "encore.dev/api";
import type { OutgoingEvent } from "./stream";

// This is a simplified global event bus. In a real-world scenario,
// you'd use a proper message queue (like Redis Pub/Sub) to broadcast
// events to the correct user's stream connection, even across multiple replicas.
const userStreams = new Map<string, StreamInOut<any, OutgoingEvent>>();

// Global event stream for a user
export const userEvents = api.streamInOut<void, OutgoingEvent>(
  { expose: true, path: "/messenger/user/events" },
  async (stream) => {
    const userId = "00000000-0000-0000-0000-000000000000"; // default user
    userStreams.set(userId, stream);

    try {
      // Keep stream open, wait for client to close
      for await (const _ of stream) {
        // Incoming messages from client on this stream are ignored for now
      }
    } finally {
      userStreams.delete(userId);
    }
  }
);

// Function to send an event to a specific user
export function sendToUser(userId: string, event: OutgoingEvent) {
  const stream = userStreams.get(userId);
  if (stream) {
    stream.send(event).catch(() => {
      userStreams.delete(userId);
    });
  }
}
