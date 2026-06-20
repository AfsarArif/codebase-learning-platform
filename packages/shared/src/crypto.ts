// AES-256-GCM encryption for sensitive data at rest
// Uses ENCRYPTION_KEY (32 bytes, hex-encoded) from environment

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex chars)');
  }
  return key;
}

export async function encrypt(plaintext: string): Promise<string> {
  const { randomBytes, createCipheriv } = await import('node:crypto');
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // Format: iv:authTag:ciphertext (all hex)
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export async function decrypt(encryptedString: string): Promise<string> {
  const { createDecipheriv } = await import('node:crypto');
  const key = getEncryptionKey();
  const [ivHex, authTagHex, ciphertext] = encryptedString.split(':');
  if (!ivHex || !authTagHex || !ciphertext) {
    throw new Error('Invalid encrypted string format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
