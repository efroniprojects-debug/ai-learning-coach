import jwt from 'jsonwebtoken';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET environment variable is required');
  return s;
}

function getRefreshSecret(): string {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error('JWT_REFRESH_SECRET environment variable is required');
  return s;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export class JWTService {
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN } as any);
  }

  static generateRefreshToken(payload: JWTPayload): string {
    return jwt.sign(payload, getRefreshSecret(), { expiresIn: JWT_REFRESH_EXPIRES_IN } as any);
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, getSecret()) as JWTPayload;
    } catch {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, getRefreshSecret()) as JWTPayload;
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static decodeToken(token: string) {
    return jwt.decode(token);
  }
}
