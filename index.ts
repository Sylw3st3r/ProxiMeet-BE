import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import cors from "cors";

import HttpError from "./models/error";
import userRoutes from "./routers/user-router";
import eventsRoutes from "./routers/events-router";
import notificationsRouter from "./routers/notifications-router";
import { initWebSocket } from "./websockets/websockets-server";
import http from "http";

const app = express();

app.use(bodyParser.json());

// Make images from images directory available for FE
app.use("/images", express.static("images"));

app.use(cors({ origin: "*" }));

app.use("/users", userRoutes);
app.use("/events", eventsRoutes);
app.use("/notifications", notificationsRouter);

const server = http.createServer(app);

// Attach WebSocket server to existing HTTP server
initWebSocket(server);

// Error handling middleware
app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error);
  }
  console.log(error);
  res.status(error.code || 500).json({
    errorDescription: error.message || "Unknown error has occurred!",
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log(
    `Server (HTTP + WS) running on http://localhost:${process.env.PORT || 3001}`
  );
});
