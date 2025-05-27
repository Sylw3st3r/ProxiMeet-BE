export interface ChatMessage {
  id: number;
  event_id: number;
  sender_id: number | null;
  message: string;
  timestamp: string;
}
