import { User } from "../models/user.model.js";
import WebSocket from "ws";
import { ChatMessage } from "../models/chat-message.model.js";
import CACHED_EVENT_PARTICIPANTS from "../sockets/cached-event-participants";
import OPEN_CONNECTIONS_MAP from "../sockets/open-connections";
import { getEventAttendees } from "../db-utils/event-db-utils";

// Get the current participant list for an event
export function getParticipantsForEvent(eventId: number): Set<number> {
  let participants = CACHED_EVENT_PARTICIPANTS.get(eventId);

  if (!participants) {
    const participantsArray = getEventAttendees(eventId);
    participants = new Set(participantsArray);
    CACHED_EVENT_PARTICIPANTS.set(eventId, participants);
  }

  return participants;
}

// Send a chat message from a user
export function sendChatMessage(
  fromUserId: number,
  eventId: number,
  content: string
): void {
  const participants = getParticipantsForEvent(eventId);

  if (!participants.has(fromUserId)) {
    // Not allowed to send if not a participant
    return;
  }

  const msg: ChatMessage = {
    eventId,
    sender: fromUserId,
    message: content,
    timestamp: Date.now(),
  };

  broadcastToParticipants(eventId, msg);
}

// Send a system message (e.g., user joined/left)
function sendSystemMessage(eventId: number, content: string): void {
  const msg: ChatMessage = {
    eventId,
    sender: 0,
    message: content,
    timestamp: Date.now(),
  };

  broadcastToParticipants(eventId, msg);
}

// Broadcast a message to all participants of an event
function broadcastToParticipants(eventId: number, message: ChatMessage): void {
  const participants = getParticipantsForEvent(eventId);

  OPEN_CONNECTIONS_MAP.forEach((socket, userId) => {
    if (socket.readyState === WebSocket.OPEN && participants.has(userId)) {
      socket.send(JSON.stringify(message));
    }
  });
}

// User leaves the chat
export function removeUserFromChat(user: User, eventId: number): void {
  sendSystemMessage(
    eventId,
    `${user.firstName} ${user.lastName} has left the chat.`
  );
  getParticipantsForEvent(eventId).delete(user.id);
}

// User joins the chat
export function addUserToChat(user: User, eventId: number): void {
  getParticipantsForEvent(eventId).add(user.id);
  sendSystemMessage(
    eventId,
    `${user.firstName} ${user.lastName} has joined the chat.`
  );
}
