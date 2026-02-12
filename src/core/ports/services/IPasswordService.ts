/**
 * Port: Password Service Interface
 * Abstracts password hashing and verification
 */
export interface IPasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
