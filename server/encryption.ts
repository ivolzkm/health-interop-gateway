import crypto from 'crypto';

/**
 * Encryption module for healthcare data
 * Implements AES-256-GCM for authenticated encryption
 * Supports both at-rest and in-transit encryption
 */

const ALGORITHM = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;
const IV_LENGTH = 12;
const SALT_LENGTH = 32;

interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  salt: string;
}

/**
 * Derives a key from a password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

/**
 * Encrypts data using AES-256-GCM
 * @param plaintext - Data to encrypt
 * @param encryptionKey - Encryption key (should be from environment)
 * @returns Encrypted data object with all necessary components
 */
export function encryptData(plaintext: string, encryptionKey: string): EncryptedData {
  try {
    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key from password
    const key = deriveKey(encryptionKey, salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt data
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      ciphertext,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      salt: salt.toString('hex'),
    };
  } catch (error) {
    console.error('[Encryption] Failed to encrypt data:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts data encrypted with encryptData
 * @param encrypted - Encrypted data object
 * @param encryptionKey - Encryption key (should be from environment)
 * @returns Decrypted plaintext
 */
export function decryptData(encrypted: EncryptedData, encryptionKey: string): string {
  try {
    // Reconstruct components from encrypted data
    const iv = Buffer.from(encrypted.iv, 'hex');
    const salt = Buffer.from(encrypted.salt, 'hex');
    const authTag = Buffer.from(encrypted.authTag, 'hex');

    // Derive key using same salt
    const key = deriveKey(encryptionKey, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    console.error('[Encryption] Failed to decrypt data:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Hashes sensitive data for storage (one-way)
 * Used for audit trails where we don't need to decrypt
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generates a random API key for client authentication
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validates that encryption key meets security requirements
 */
export function validateEncryptionKey(key: string): boolean {
  // Key should be at least 32 characters
  return key.length >= 32;
}
