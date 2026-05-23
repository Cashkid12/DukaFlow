/**
 * DukaFlow Icon Generator
 *
 * Converts the DukaFlow SVG logo into all required PNG sizes for PWA manifest.
 *
 * Usage:
 *   npm install sharp --save-dev   (first time only)
 *   node scripts/generate-icons.mjs
 *
 * Output: public/icons/icon-{size}x{size}.png
 */

import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// The SVG logo content (same icon mark used in favicon and Logo component)
const svgContent = readFileSync(resolve(projectRoot, 'public/favicon.svg'), 'utf-8');

const SIZES = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 256, 384, 512];

async function generate() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error(
      '\n❌ sharp is not installed.\n' +
      '   Run: npm install sharp --save-dev\n' +
      '   Then run this script again.\n'
    );
    process.exit(1);
  }

  const outDir = resolve(projectRoot, 'public/icons');
  mkdirSync(outDir, { recursive: true });

  for (const size of SIZES) {
    const outPath = resolve(outDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`✅ Generated icon-${size}x${size}.png`);
  }

  // Also create a maskable version with padding (512x512 with 80% safe zone)
  const maskable = resolve(outDir, 'icon-512x512-maskable.png');
  await sharp(Buffer.from(svgContent))
    .resize(410, 410, { fit: 'contain', background: { r: 49, g: 46, b: 129, alpha: 1 } })
    .extend({ top: 51, bottom: 51, left: 51, right: 51, background: { r: 49, g: 46, b: 129, alpha: 1 } })
    .png()
    .toFile(maskable);
  console.log('✅ Generated icon-512x512-maskable.png (with safe zone padding)');

  console.log(`\n🎉 All ${SIZES.length + 1} icons generated in public/icons/`);
}

generate();
