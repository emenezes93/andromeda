import { BadRequestError } from '@shared/errors/index.js';

export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export function toDateOnly(dateInput: string): Date {
  const [year, month, day] = dateInput.split('T')[0].split('-').map((v) => Number(v));
  if (!year || !month || !day) {
    throw new BadRequestError('Data inválida');
  }
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export function parseDataUriImage(uri: string): { mimeType: string; buffer: Buffer } | null {
  const match = uri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1].toLowerCase();
  const base64Data = match[2];
  try {
    return { mimeType, buffer: Buffer.from(base64Data, 'base64') };
  } catch {
    return null;
  }
}

export function refreshTokenExpiresAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return date;
}
