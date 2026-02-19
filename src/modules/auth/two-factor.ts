import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import type { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyResult {
  valid: boolean;
  usedBackupCode?: boolean;
}

/**
 * Generate a new 2FA secret for a user
 */
export function generateTwoFactorSecret(userEmail: string, tenantName: string): speakeasy.GeneratedSecret {
  return speakeasy.generateSecret({
    name: `${tenantName} (${userEmail})`,
    issuer: 'Anamnese Inteligente',
    length: 32,
  });
}

/**
 * Generate backup codes for 2FA recovery
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-digit codes
    const code = crypto.randomInt(10000000, 99999999).toString();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify a TOTP token
 */
export function verifyTotpToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps (60 seconds) of tolerance
  });
}

/**
 * Verify a backup code
 */
export async function verifyBackupCode(
  prisma: PrismaClient,
  userId: string,
  code: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorBackupCodes: true },
  });

  if (!user || !user.twoFactorBackupCodes || user.twoFactorBackupCodes.length === 0) {
    return false;
  }

  const hashedCode = hashBackupCode(code);
  const index = user.twoFactorBackupCodes.indexOf(hashedCode);

  if (index === -1) {
    return false;
  }

  // Remove used backup code
  const updatedCodes = [...user.twoFactorBackupCodes];
  updatedCodes.splice(index, 1);

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorBackupCodes: updatedCodes },
  });

  return true;
}

/**
 * Generate QR code URL for 2FA setup
 */
export async function generateQRCodeUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}
