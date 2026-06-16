import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

function getEncryptionKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ||
    process.env.CLERK_SECRET_KEY ||
    "fallback_secret_key_must_be_32_bytes_long!!";

  // Always hash the secret to ensure it is exactly 32 bytes (256 bits)
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts plain text using AES-256-CBC.
 * Returns a string formatted as "ivHex:encryptedHex".
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a string formatted as "ivHex:encryptedHex" back to plain text.
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(":");
  const ivHex = parts[0];
  const encrypted = parts[1];

  if (!ivHex || !encrypted) {
    throw new Error("Invalid encrypted text format. Expected ivHex:encryptedHex");
  }

  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
