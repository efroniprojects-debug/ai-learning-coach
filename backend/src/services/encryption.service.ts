import crypto from 'crypto';

const ENCRYPTION_ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';

function getKey(): Buffer {
  const k = process.env.ENCRYPTION_KEY;
  if (!k) throw new Error('ENCRYPTION_KEY environment variable is required');
  return Buffer.from(k, 'base64') as any;
}

export class EncryptionService {
  private static readonly algorithm = ENCRYPTION_ALGORITHM;

  static encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16) as any;
    const cipherObj = crypto.createCipheriv(this.algorithm as any, getKey() as any, iv);

    let encrypted = cipherObj.update(plaintext, 'utf8', 'hex');
    encrypted += cipherObj.final('hex');

    const authTag = (cipherObj as any).getAuthTag();

    const combined = iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    return combined;
  }

  static decrypt(encrypted: string): string {
    try {
      const parts = encrypted.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex') as any;
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipherObj = crypto.createDecipheriv(this.algorithm as any, getKey() as any, iv);
      (decipherObj as any).setAuthTag(authTag);

      let decrypted = decipherObj.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipherObj.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed. Key may be corrupted or invalid.');
    }
  }
}
