import bcrypt from 'bcrypt';
import type { PrismaClient } from '@prisma/client';

export const PASSWORD_HISTORY_LIMIT = 5; // Não permitir reutilizar últimas 5 senhas

export interface PasswordPolicyConfig {
  historyLimit?: number;
  expiryDays?: number | null; // null = sem expiração
}

export async function checkPasswordHistory(
  prisma: PrismaClient,
  userId: string,
  newPassword: string,
  historyLimit: number = PASSWORD_HISTORY_LIMIT
): Promise<boolean> {
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: historyLimit,
  });

  for (const entry of history) {
    const match = await bcrypt.compare(newPassword, entry.passwordHash);
    if (match) return false; // Senha já foi usada
  }

  return true; // Senha não está no histórico
}

export async function savePasswordHistory(
  prisma: PrismaClient,
  userId: string,
  passwordHash: string
): Promise<void> {
  await prisma.passwordHistory.create({
    data: { userId, passwordHash },
  });

  // Limpar histórico antigo (manter apenas os últimos N)
  const history = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: PASSWORD_HISTORY_LIMIT,
    select: { id: true },
  });

  if (history.length > 0) {
    await prisma.passwordHistory.deleteMany({
      where: { id: { in: history.map((h) => h.id) } },
    });
  }
}

export function calculatePasswordExpiry(expiryDays: number | null): Date | null {
  if (expiryDays === null || expiryDays <= 0) return null;
  const date = new Date();
  date.setDate(date.getDate() + expiryDays);
  return date;
}

export function isPasswordExpired(passwordExpiresAt: Date | null): boolean {
  if (!passwordExpiresAt) return false;
  return new Date() > passwordExpiresAt;
}
