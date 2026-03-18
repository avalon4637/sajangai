// Credential encryption utilities using AES-256-GCM
// Used to safely store API credentials in the database

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256-bit key

/**
 * Get the encryption key from environment.
 * Falls back to a deterministic key derived from NEXTAUTH_SECRET for development.
 *
 * @throws Error if no encryption key is available in production
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY;

  if (keyHex) {
    const key = Buffer.from(keyHex, "hex");
    if (key.length !== KEY_LENGTH) {
      throw new Error(
        `CREDENTIAL_ENCRYPTION_KEY must be ${KEY_LENGTH * 2} hex characters (${KEY_LENGTH} bytes)`
      );
    }
    return key;
  }

  // Development fallback using a static key derived from a known value
  // WARNING: Not secure for production - set CREDENTIAL_ENCRYPTION_KEY in env
  if (process.env.NODE_ENV !== "production") {
    const fallbackSecret =
      process.env.NEXTAUTH_SECRET ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "dev-fallback-key-sajang-ai-hyphen";
    const { createHash } = require("crypto");
    return createHash("sha256").update(fallbackSecret).digest();
  }

  throw new Error(
    "CREDENTIAL_ENCRYPTION_KEY environment variable is required in production"
  );
}

/** Encrypted credential format stored in database */
interface EncryptedData {
  iv: string; // hex
  authTag: string; // hex
  ciphertext: string; // hex
}

/**
 * Encrypt credentials object using AES-256-GCM.
 * Returns a JSON string safe for database storage.
 *
 * @param credentials - Object containing sensitive credential fields
 * @returns JSON string with encrypted data
 */
export function encryptCredentials(
  credentials: Record<string, string>
): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const plaintext = JSON.stringify(credentials);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const data: EncryptedData = {
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    ciphertext: encrypted.toString("hex"),
  };

  return JSON.stringify(data);
}

/**
 * Decrypt credentials from encrypted storage format.
 *
 * @param encryptedJson - JSON string from encryptCredentials()
 * @returns Original credentials object
 * @throws Error if decryption fails (wrong key or tampered data)
 */
export function decryptCredentials(
  encryptedJson: string
): Record<string, string> {
  const key = getEncryptionKey();
  const data: EncryptedData = JSON.parse(encryptedJson);

  const iv = Buffer.from(data.iv, "hex");
  const authTag = Buffer.from(data.authTag, "hex");
  const ciphertext = Buffer.from(data.ciphertext, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}
