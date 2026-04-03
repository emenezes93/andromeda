/**
 * Gera versões da logo otimizadas para o site (1x e 2x para retina).
 * Uso: node scripts/build-logo.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');

const SOURCE = path.join(root, 'public', 'logo.jpeg');
const HEIGHT_1X = 40;   // base (header h-9 ≈ 36px, footer h-8 ≈ 32px)
const HEIGHT_2X = 80;  // retina

async function build() {
  try {
    await sharp(SOURCE)
      .resize({ height: HEIGHT_1X, fit: 'inside', withoutEnlargement: false })
      .png({ quality: 90 })
      .toFile(path.join(publicDir, 'logo.png'));

    await sharp(SOURCE)
      .resize({ height: HEIGHT_2X, fit: 'inside', withoutEnlargement: false })
      .png({ quality: 90 })
      .toFile(path.join(publicDir, 'logo@2x.png'));

    console.log('Logo gerada: public/logo.png (1x), public/logo@2x.png (2x)');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

build();
