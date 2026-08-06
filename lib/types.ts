import { z } from "zod";
import type { AdditionalInformationRequest } from "@/lib/api/manufacturer-additional-information";

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
  role: z.enum(["buyer", "manufacturer", "admin"]),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  agreed_to_terms: boolean;
  created_at: string;
  updated_at: string | null;
  manufacture_status?: string | null;
  additional_information_requests?: AdditionalInformationRequest[];
}

/** Present on successful login and immediate post-register (e.g. buyer). */
export interface AuthTokenPayload {
  token_type: string;
  access_token: string;
  user: User;
}

export interface EmailVerificationChallenge {
  verification_token: string;
  code_expiry_time: number;
}

/**
 * Login and register share this envelope. Register may return `data: null` and
 * `manufacture_status` when the manufacturer account is pending review.
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  data: AuthTokenPayload | EmailVerificationChallenge | null;
  manufacture_status?: string | null;
}

export interface EmailVerificationVerifyResponse {
  success: boolean;
  message: string;
  data: AuthTokenPayload | null;
}

export interface EmailVerificationResendResponse {
  success: boolean;
  message: string;
  data: EmailVerificationChallenge | {
    retry_after_seconds?: number;
    available_at?: string;
  } | null;
}
