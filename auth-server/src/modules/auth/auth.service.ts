import bcrypt from 'bcrypt';
import { env } from '#config';
import { BadRequestError } from '#utils';
import { userRepository } from '#modules/users';
import { emailService, tokenService } from '#modules/email';
import { type ForgotPasswordDto, type ResetPasswordDto } from './auth.dto.ts';
import { AUTH_MESSAGES } from './auth.constants.ts';

class AuthService {
  /**
   * Verifies a user's email using a single-use 24-hour token from Redis
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const userId = await tokenService.consumeVerificationToken(token);

    if (!userId) {
      throw new BadRequestError(AUTH_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }

    const updatedUser = await userRepository.updateVerificationStatus(userId, true);
    if (!updatedUser) {
      throw new BadRequestError('User account associated with this token was not found.');
    }

    return { message: AUTH_MESSAGES.EMAIL_VERIFIED_SUCCESS };
  }

  /**
   * Initiates password reset with anti-enumeration protection
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(dto.email);

    // Anti-Enumeration: If user exists, create token and send email.
    // If user does NOT exist, still return the same success message!
    if (user) {
      const token = await tokenService.createPasswordResetToken(user._id.toString());
      await emailService.sendPasswordResetEmail(user.email, user.name, token);
    }

    return { message: AUTH_MESSAGES.FORGOT_PASSWORD_SUCCESS };
  }

  /**
   * Resets the user's password using a 15-minute token and Bcrypt hashing (cost 12)
   */
  async resetPassword(token: string, dto: ResetPasswordDto): Promise<{ message: string }> {
    const userId = await tokenService.consumePasswordResetToken(token);

    if (!userId) {
      throw new BadRequestError(AUTH_MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }

    // Salt and hash new password using Bcrypt with work factor 12
    const salt = await bcrypt.genSalt(env.AUTH_BCRYPT_ROUNDS);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const updatedUser = await userRepository.updatePasswordHash(userId, passwordHash);
    if (!updatedUser) {
      throw new BadRequestError('User account associated with this token was not found.');
    }

    return { message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS };
  }

  /**
   * Resends verification email with anti-enumeration protection
   */
  async resendVerification(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await userRepository.findByEmail(dto.email);

    if (user && !user.isVerified) {
      const token = await tokenService.createVerificationToken(user._id.toString());
      await emailService.sendVerificationEmail(user.email, user.name, token);
    }

    return { message: AUTH_MESSAGES.RESEND_VERIFICATION_SUCCESS };
  }
}

export const authService = new AuthService();
