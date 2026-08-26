import { db, users, sessions } from '@/db';
import { eq } from 'drizzle-orm';
// NOTE: never use db.query.* — requires relations setup; use db.select().from().where().limit()
import { JWTService } from './jwt.service';
import axios from 'axios';
import crypto from 'crypto';

function getGoogleCreds() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error('Google OAuth environment variables are not set');
  }
  return { clientId, clientSecret, callbackUrl };
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export class AuthService {
  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const { clientId, clientSecret, callbackUrl } = getGoogleCreds();
    try {
      const response = await axios.post<GoogleTokenResponse>(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }
      );
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const googleError = err.response.data as { error?: string; error_description?: string };
        throw new Error(`Google token exchange failed: ${googleError.error} — ${googleError.error_description}`);
      }
      throw err;
    }
  }

  /**
   * Get user info from Google
   */
  static async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await axios.get<GoogleUserInfo>(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  }

  /**
   * Handle Google OAuth callback
   */
  static async handleGoogleCallback(code: string) {
    // Exchange code for tokens
    const googleTokens = await this.exchangeCodeForTokens(code);

    // Get user info from Google
    const googleUser = await this.getGoogleUserInfo(googleTokens.access_token);

    // Find or create user
    const [existingUser] = await db.select().from(users).where(eq(users.googleId, googleUser.id)).limit(1);
    let user = existingUser;

    if (!user) {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          email: googleUser.email,
          googleId: googleUser.id,
          displayName: googleUser.name,
          profilePicture: googleUser.picture,
        })
        .returning();

      user = newUser;
    } else {
      // Update user info if changed
      await db
        .update(users)
        .set({
          displayName: googleUser.name,
          profilePicture: googleUser.picture,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    // Generate JWT tokens
    const accessToken = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = JWTService.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token (hashed)
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Determine expiration (7 days from now)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(sessions).values({
      userId: user.id,
      refreshTokenHash,
      expiresAt,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        language: user.language,
        theme: user.theme,
        focusModeEnabled: user.focusModeEnabled,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes
      },
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string, userId: string) {
    // Verify refresh token
    const payload = JWTService.verifyRefreshToken(refreshToken);

    if (payload.userId !== userId) {
      throw new Error('Invalid refresh token');
    }

    // Check if session exists (optional, for extra security)
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const [session] = await db.select().from(sessions).where(eq(sessions.refreshTokenHash, refreshTokenHash)).limit(1);

    if (!session) {
      throw new Error('Session not found');
    }

    // Generate new access token
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const newAccessToken = JWTService.generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken: newAccessToken,
      refreshToken, // Return same refresh token (can implement rotation if needed)
      expiresIn: 900, // 15 minutes
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      profilePicture: user.profilePicture,
      language: user.language,
      theme: user.theme,
      focusModeEnabled: user.focusModeEnabled,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Logout user (delete session)
   */
  static async logout(refreshToken: string) {
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await db.delete(sessions).where(eq(sessions.refreshTokenHash, refreshTokenHash));
  }
}
