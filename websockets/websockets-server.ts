import { verifyAccessToken } from "../utils/auth";
import { getEventAttendees } from "../utils/db/events";
import connectedUsers from "./connected-users";

const WebSocket = require("ws");

export function initWebSocket(server: any) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", function connection(ws: any, req: any) {
    // On handshake we need to check if the user is authenticated
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    let userId;

    if (!token) {
      ws.close(4000, "No token provided");
      return;
    }

    try {
      const tokenData = verifyAccessToken(token);
      userId = tokenData.userId;
      connectedUsers.set(userId, ws);
    } catch {
      ws.close(4001, "Invalid token");
      return;
    }

    ws.on("message", async function incoming(data: string) {
      try {
        const { eventId, message } = JSON.parse(data);

        //   const attendees = getEventAttendees(eventId);
        const msg = {
          eventId,
          sender: userId,
          message,
          timestamp: Date.now(),
        };

        connectedUsers.forEach((socket, id) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(msg));
          }
        });

        //   attendees
        //     .filter(id => id !== userId)
        //     .forEach(id => {
        //       // Check if the attendee is connected. If thats the case then send the message
        //       const socket = connectedUsers.get(id);
        //       if (socket && socket.readyState === WebSocket.OPEN) {
        //         socket.send(JSON.stringify(msg));
        //       }
        //     });
      } catch (err) {
        console.error("Error handling message:", err);
      }
    });

    ws.on("close", () => {
      connectedUsers.delete(userId);
    });
  });
}
