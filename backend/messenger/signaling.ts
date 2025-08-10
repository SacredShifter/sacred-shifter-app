import { api, StreamInOut } from "encore.dev/api";
import type { SignalingMessage } from "./types";

// In-memory store for signaling channels.
// Not scalable across multiple replicas without a distributed cache.
const callChannels = new Map<string, Set<StreamInOut<SignalingMessage, SignalingMessage>>>();

interface Handshake {
  callId: string;
}

// WebRTC signaling stream
export const signaling = api.streamInOut<Handshake, SignalingMessage, SignalingMessage>(
  { expose: true, path: "/messenger/signaling" },
  async (handshake, stream) => {
    const { callId } = handshake;
    if (!callId) {
      await stream.close();
      return;
    }

    // Add stream to the call channel
    if (!callChannels.has(callId)) {
      callChannels.set(callId, new Set());
    }
    const channel = callChannels.get(callId)!;
    channel.add(stream);

    try {
      for await (const message of stream) {
        // Broadcast message to all other participants in the call
        for (const peerStream of channel) {
          if (peerStream !== stream) {
            peerStream.send(message).catch(() => {
              // Remove stream if sending fails
              channel.delete(peerStream);
            });
          }
        }
      }
    } finally {
      // Clean up on disconnect
      channel.delete(stream);
      if (channel.size === 0) {
        callChannels.delete(callId);
      }
    }
  }
);
