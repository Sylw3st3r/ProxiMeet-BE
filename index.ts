import express, { Request, Response, NextFunction } from "express";
import http from "http";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";

import HttpError from "./models/error.model";
import userRoutes from "./routers/user-router";
import eventsRoutes from "./routers/events-router";
import notificationsRouter from "./routers/notifications-router";
import profileRouter from "./routers/profile-router";
import { initializeWebSocket } from "./sockets/websockets-server";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Static assets
app.use("/images", express.static("images"));

// Routes
app.use("/users", userRoutes);
app.use("/profile", profileRouter);
app.use("/events", eventsRoutes);
app.use("/notifications", notificationsRouter);

// Error Handling Middleware
app.use((error: HttpError, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error("Server error:", error);

  res.status(error.code || 500).json({
    message: error.message || "Unknown error has occurred!",
  });
});

// Start server + WebSocket
const server = http.createServer(app);
initializeWebSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 Server (HTTP + WS) running on http://localhost:${PORT}`);
});
