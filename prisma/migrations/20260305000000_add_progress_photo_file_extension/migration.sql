-- P1.1: Upload real de fotos de progresso — coluna para extensão do arquivo armazenado em disco
ALTER TABLE "progress_photos" ADD COLUMN IF NOT EXISTS "file_extension" VARCHAR(10);
