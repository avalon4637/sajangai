// Solapi REST API client for KakaoTalk AlimTalk and SMS fallback
// Authentication uses HMAC-SHA256 signature with API Key + Secret
// API endpoint: https://api.solapi.com/messages/v4/send
// DO NOT use solapi npm package - use raw fetch + Node.js crypto

import crypto from "crypto";

const SOLAPI_API_ENDPOINT = "https://api.solapi.com/messages/v4/send";

export interface AlimTalkButton {
  buttonType: "WL" | "AL" | "DS" | "BK" | "MD";
  buttonName: string;
  linkMo?: string;
  linkPc?: string;
  linkAnd?: string;
  linkIos?: string;
}

export interface AlimTalkMessage {
  to: string;
  from?: string;
  kakaoOptions: {
    pfId: string;
    templateId: string;
    variables?: Record<string, string>;
    buttons?: AlimTalkButton[];
  };
}

export interface SmsMessage {
  to: string;
  from?: string;
  text: string;
  type?: "SMS" | "LMS";
}

export interface SolapiResponse {
  groupId: string;
  count: {
    total: number;
    sentTotal: number;
    sentFailed: number;
    sentSuccess: number;
  };
}

export interface SolapiError {
  errorCode: string;
  errorMessage: string;
}

// @MX:ANCHOR: Solapi authentication header generator - used by all send functions
// @MX:REASON: HMAC-SHA256 auth required for every API call; shared by sendAlimTalk and sendSMS
function buildAuthHeader(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

/**
 * Send a KakaoTalk AlimTalk message via Solapi REST API.
 * Falls back gracefully - caller should catch and retry with SMS if needed.
 *
 * @param phoneNumber - Recipient phone number (e.g., "01012345678")
 * @param templateId - Kakao registered template ID
 * @param variables - Template variable substitutions
 * @param buttons - Optional CTA buttons
 */
export async function sendAlimTalk(
  phoneNumber: string,
  templateId: string,
  variables?: Record<string, string>,
  buttons?: AlimTalkButton[]
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const pfId = process.env.SOLAPI_PFID;

  if (!apiKey || !apiSecret || !pfId) {
    console.warn("[Solapi] Missing credentials - skipping AlimTalk");
    return { success: false, error: "Missing Solapi credentials" };
  }

  const message: AlimTalkMessage = {
    to: phoneNumber.replace(/-/g, ""),
    kakaoOptions: {
      pfId,
      templateId,
      variables,
      buttons,
    },
  };

  try {
    const response = await fetch(SOLAPI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildAuthHeader(apiKey, apiSecret),
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorBody = (await response.json()) as SolapiError;
      console.error("[Solapi] AlimTalk failed:", errorBody);
      return {
        success: false,
        error: `${errorBody.errorCode}: ${errorBody.errorMessage}`,
      };
    }

    const result = (await response.json()) as SolapiResponse;
    const sent = result.count?.sentSuccess > 0;
    return { success: sent, error: sent ? undefined : "Message not delivered" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Solapi] AlimTalk network error:", message);
    return { success: false, error: message };
  }
}

/**
 * Send a plain SMS message via Solapi REST API.
 * Used as fallback when AlimTalk delivery fails.
 * LMS is used automatically when text exceeds 90 bytes.
 *
 * @param phoneNumber - Recipient phone number
 * @param text - Message body (Korean supported)
 */
export async function sendSMS(
  phoneNumber: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;

  if (!apiKey || !apiSecret) {
    console.warn("[Solapi] Missing credentials - skipping SMS");
    return { success: false, error: "Missing Solapi credentials" };
  }

  // LMS if text exceeds 90 bytes (Korean chars are ~3 bytes each)
  const byteLength = Buffer.byteLength(text, "utf8");
  const type = byteLength > 90 ? "LMS" : "SMS";

  const message: SmsMessage = {
    to: phoneNumber.replace(/-/g, ""),
    text,
    type,
  };

  try {
    const response = await fetch(SOLAPI_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildAuthHeader(apiKey, apiSecret),
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorBody = (await response.json()) as SolapiError;
      console.error("[Solapi] SMS failed:", errorBody);
      return {
        success: false,
        error: `${errorBody.errorCode}: ${errorBody.errorMessage}`,
      };
    }

    const result = (await response.json()) as SolapiResponse;
    const sent = result.count?.sentSuccess > 0;
    return { success: sent, error: sent ? undefined : "SMS not delivered" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Solapi] SMS network error:", message);
    return { success: false, error: message };
  }
}
