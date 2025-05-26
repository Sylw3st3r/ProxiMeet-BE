import WebSocket from "ws";
import { IncomingMessage } from "http";
import { verifyAccessToken } from "../utils/auth.utils"; // Assuming this exists
import { sendChatMessage } from "../utils/chat.utils";
import OPEN_CONNECTIONS_MAP from "./open-connections";

interface TokenData {
  userId: number;
}

// Initialize WebSocket server
export function initializeWebSocket(server: any) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    let userId: number;

    if (!token) {
      ws.close(4000, "No token provided");
      return;
    }

    try {
      const tokenData = verifyAccessToken(token) as TokenData;
      userId = tokenData.userId;
      OPEN_CONNECTIONS_MAP.set(userId, ws);
    } catch (error) {
      ws.close(4001, "Invalid token");
      return;
    }

    ws.on("message", (data: string) => {
      try {
        const { eventId, message } = JSON.parse(data);
        if (typeof eventId === "number" && typeof message === "string") {
          sendChatMessage(userId, eventId, message);
        } else {
          console.warn("Invalid message format");
        }
      } catch (err) {
        console.error("Failed to handle incoming message:", err);
      }
    });

    ws.on("close", () => {
      OPEN_CONNECTIONS_MAP.delete(userId);
    });
  });
}
