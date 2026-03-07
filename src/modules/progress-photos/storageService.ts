/**
 * P1.1 — Serviço de armazenamento local para fotos de progresso.
 * Salva arquivos em disco sob UPLOAD_STORAGE_PATH/progress-photos/{tenantId}/{photoId}.{ext}
 * e permite resolver o path para leitura (GET file).
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '@config/env.js';

const SUBDIR = 'progress-photos';
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function getBaseDir(): string {
  return path.resolve(env.UPLOAD_STORAGE_PATH, SUBDIR);
}

function getPhotoDir(tenantId: string): string {
  return path.join(getBaseDir(), tenantId);
}

/**
 * Retorna a extensão a usar a partir do mimetype (ou do nome do arquivo como fallback).
 */
export function extensionFromMime(mimeType: string, filename?: string): string {
  const ext = MIME_TO_EXT[mimeType?.toLowerCase()];
  if (ext) return ext;
  if (filename) {
    const fromName = path.extname(filename).toLowerCase();
    if (ALLOWED_EXT.has(fromName)) return fromName;
  }
  return '.jpg';
}

/**
 * Salva o buffer no disco em {base}/{tenantId}/{photoId}{ext}.
 * Cria os diretórios se não existirem.
 * @returns extensão usada (ex: '.jpg')
 */
export async function saveProgressPhotoFile(
  tenantId: string,
  photoId: string,
  buffer: Buffer,
  mimeType: string,
  filename?: string
): Promise<string> {
  const ext = extensionFromMime(mimeType, filename);
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(`Tipo de arquivo não permitido. Use: ${[...ALLOWED_EXT].join(', ')}`);
  }
  const dir = getPhotoDir(tenantId);
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${photoId}${ext}`);
  await fs.writeFile(filePath, buffer);
  return ext;
}

/**
 * Path absoluto do arquivo no disco para um photo existente (tenantId + photoId + ext).
 */
export function getProgressPhotoFilePath(tenantId: string, photoId: string, fileExtension: string): string {
  const ext = fileExtension.startsWith('.') ? fileExtension : `.${fileExtension}`;
  return path.join(getPhotoDir(tenantId), `${photoId}${ext}`);
}

/**
 * Verifica se o arquivo existe no disco.
 */
export async function progressPhotoFileExists(tenantId: string, photoId: string, fileExtension: string): Promise<boolean> {
  const filePath = getProgressPhotoFilePath(tenantId, photoId, fileExtension);
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lê o arquivo do disco como Buffer (para streaming na resposta HTTP).
 */
export async function readProgressPhotoFile(tenantId: string, photoId: string, fileExtension: string): Promise<Buffer> {
  const filePath = getProgressPhotoFilePath(tenantId, photoId, fileExtension);
  return fs.readFile(filePath);
}
