import crypto from 'node:crypto';
import { getRedisClient } from '#config';
import {
  EMAIL_TOKEN_BYTES,
  EMAIL_TOKEN_EXPIRIES_SECONDS,
  EMAIL_REDIS_PREFIXES,
} from './email.constants.ts';

class TokenService {
  /**
   * Generates a cryptographically secure 256-bit random hex token (64 characters)
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(EMAIL_TOKEN_BYTES).toString('hex');
  }

  /**
   * Creates an email verification token in Redis with a 24-hour TTL
   */
  async createVerificationToken(userId: string): Promise<string> {
    const redis = getRedisClient();
    const token = this.generateSecureToken();
    const key = `${EMAIL_REDIS_PREFIXES.VERIFY}${token}`;

    await redis.set(key, userId, { EX: EMAIL_TOKEN_EXPIRIES_SECONDS.VERIFICATION });
    return token;
  }

  /**
   * Atomically validates and consumes (deletes) a verification token
   * Returns userId if valid, or null if expired/non-existent
   */
  async consumeVerificationToken(token: string): Promise<string | null> {
    const redis = getRedisClient();
    const key = `${EMAIL_REDIS_PREFIXES.VERIFY}${token}`;
    const userId = await redis.get(key);

    if (!userId) return null;

    // Single-use guarantee: delete token immediately
    await redis.del(key);
    return userId;
  }

  /**
   * Creates a password reset token in Redis with a 15-minute TTL
   */
  async createPasswordResetToken(userId: string): Promise<string> {
    const redis = getRedisClient();
    const token = this.generateSecureToken();
    const key = `${EMAIL_REDIS_PREFIXES.RESET}${token}`;

    await redis.set(key, userId, { EX: EMAIL_TOKEN_EXPIRIES_SECONDS.PASSWORD_RESET });
    return token;
  }

  /**
   * Atomically validates and consumes (deletes) a password reset token
   * Returns userId if valid, or null if expired/non-existent
   */
  async consumePasswordResetToken(token: string): Promise<string | null> {
    const redis = getRedisClient();
    const key = `${EMAIL_REDIS_PREFIXES.RESET}${token}`;
    const userId = await redis.get(key);

    if (!userId) return null;

    // Single-use guarantee: delete token immediately
    await redis.del(key);
    return userId;
  }
}

export const tokenService = new TokenService();
