import bcrypt from 'bcrypt';
import { userRepository } from './users.repository.ts';
import type { IUser } from './users.model.ts';
import type { RegisterUserDto, LoginUserDto, UserResponseDto } from './users.dto.ts';
import { ConflictError, UnauthorizedError, NotFoundError } from '#utils';
import { env } from '#config';
import { emailService, tokenService } from '#modules/email';

/**
 * Helper to sanitize user documents by stripping sensitive fields like passwordHash
 */
const toUserResponse = (user: IUser): UserResponseDto => {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    subscription: {
      plan: user.subscription.plan,
      status: user.subscription.status,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
    },
    createdAt: user.createdAt,
  };
};

export const userService = {
  /**
   * Registers a new user account with bcrypt salted password hashing
   */
  register: async (dto: RegisterUserDto): Promise<UserResponseDto> => {
    // 1. Check if email is already registered
    const existingUser = await userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    // 2. Salt and hash password (cost factor: 12)
    const salt = await bcrypt.genSalt(env.AUTH_BCRYPT_ROUNDS);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // 3. Persist new user via repository
    const newUser = await userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
    });

    // 4. Generate verification token and send verification email
    const verificationToken = await tokenService.createVerificationToken(newUser._id.toString());
    await emailService.sendVerificationEmail(newUser.email, newUser.name, verificationToken);

    // 5. Return sanitized user response
    return toUserResponse(newUser);
  },

  /**
   * Authenticates user credentials and verifies password
   */
  authenticate: async (dto: LoginUserDto): Promise<IUser> => {
    // 1. Fetch user by email
    const user = await userRepository.findByEmail(dto.email);
    if (!user) {
      // Intentionally generic message to prevent account enumeration attacks
      throw new UnauthorizedError('Invalid email or password');
    }

    // 2. Constant-time password comparison
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Return the verified user entity for session/token generation
    return user;
  },

  /**
   * Fetches user by ID and returns sanitized representation
   */
  getById: async (id: string): Promise<UserResponseDto> => {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return toUserResponse(user);
  },
};
