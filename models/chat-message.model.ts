export interface ChatMessage {
  eventId: number;
  sender: number; // 0 = system
  message: string;
  timestamp: number;
}
