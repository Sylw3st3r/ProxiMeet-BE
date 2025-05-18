export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  verified: number; // typically 0 or 1
  verification_token: string | null;
  token_expires_at: number | null;
  password_reset_token: string | null;
  password_reset_token_expires_at: number | null;
}
