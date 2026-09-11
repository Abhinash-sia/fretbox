import bcrypt from 'bcryptjs';

export class PasswordService {
  private readonly saltRounds = 10;

  /**
   * Hashes a plaintext password using bcrypt.
   */
  public async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a plaintext password with a stored bcrypt hash.
   */
  public async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export const passwordService = new PasswordService();
