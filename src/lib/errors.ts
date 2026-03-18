/**
 * Auth error classification for consistent user-facing messages.
 */

export type AuthErrorType =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "user_already_registered"
  | "network"
  | "unknown";

/**
 * Classify a Supabase auth error into a known error type.
 * @param error - Supabase auth error object
 * @returns Classified error type
 */
export function classifyAuthError(error: {
  message: string;
  status?: number;
}): AuthErrorType {
  if (error.message === "Invalid login credentials")
    return "invalid_credentials";
  if (error.message === "Email not confirmed") return "email_not_confirmed";
  if (error.message === "User already registered")
    return "user_already_registered";
  if (
    error.message.includes("fetch") ||
    error.message.includes("network") ||
    error.status === 0
  )
    return "network";
  return "unknown";
}

/**
 * Korean error messages for each auth error type.
 */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorType, string> = {
  invalid_credentials: "이메일 또는 비밀번호가 올바르지 않습니다",
  email_not_confirmed:
    "이메일 인증이 필요합니다. 가입 시 입력한 이메일의 인증 링크를 확인해주세요.",
  user_already_registered: "이미 사용 중인 이메일입니다",
  network: "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.",
  unknown: "오류가 발생했습니다. 다시 시도해주세요.",
};
