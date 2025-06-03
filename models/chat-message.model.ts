export interface ChatMessage {
  id: number;
  event_id: number;
  sender: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
  message: string;
}
