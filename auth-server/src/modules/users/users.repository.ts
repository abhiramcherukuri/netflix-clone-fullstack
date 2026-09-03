import { UserModel, type IUser } from './users.model.ts';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
  role?: 'user' | 'admin';
}

export const userRepository = {
  /**
   * Finds a user by their unique email address
   */
  findByEmail: async (email: string): Promise<IUser | null> => {
    return await UserModel.findOne({ email: email.toLowerCase().trim() }).lean<IUser>().exec();
  },

  /**
   * Finds a user by their MongoDB ObjectId
   */
  findById: async (id: string): Promise<IUser | null> => {
    return await UserModel.findById(id).lean<IUser>().exec();
  },

  /**
   * Inserts a new user document into the database
   */
  create: async (userData: CreateUserData): Promise<IUser> => {
    const newUser = await UserModel.create({
      name: userData.name,
      email: userData.email,
      passwordHash: userData.passwordHash,
      role: userData.role || 'user',
      isVerified: false,
      subscription: {
        plan: 'none',
        status: 'inactive',
      },
    });

    // Return pure plain object
    return newUser.toObject() as IUser;
  },

  /**
   * Updates user email verification status
   */
  updateVerificationStatus: async (id: string, isVerified: boolean): Promise<IUser | null> => {
    return await UserModel.findByIdAndUpdate(id, { isVerified }, { new: true })
      .lean<IUser>()
      .exec();
  },

  /**
   * Updates user subscription details
   */
  updateSubscription: async (
    id: string,
    subscription: IUser['subscription'],
  ): Promise<IUser | null> => {
    return await UserModel.findByIdAndUpdate(id, { subscription }, { new: true })
      .lean<IUser>()
      .exec();
  },

  /**
   * Updates user password hash
   */
  updatePasswordHash: async (id: string, passwordHash: string): Promise<IUser | null> => {
    return await UserModel.findByIdAndUpdate(id, { passwordHash }, { new: true })
      .lean<IUser>()
      .exec();
  },
};
