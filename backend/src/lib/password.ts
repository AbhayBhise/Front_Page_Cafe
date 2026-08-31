import bcrypt from 'bcryptjs';

const ROUNDS = 10;

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

/** Basic strength gate — mirrored on the client. */
export function isStrongPassword(pw: string): boolean {
  return (
    typeof pw === 'string' &&
    pw.length >= 8 &&
    /[a-z]/.test(pw) &&
    /[A-Z0-9]/.test(pw)
  );
}
