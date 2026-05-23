/**
 * DukaFlow iOS Splash Screen Generator
 *
 * Generates splash screen PNGs for all modern iPhone and iPad sizes.
 * Uses sharp to render centered logo + wordmark + loading text on
 * an indigo (#312E81) background.
 *
 * Usage:
 *   node scripts/generate-splash.mjs
 *
 * Output: public/splash/splash-{W}x{H}.png
 */

import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// ─── Device splash sizes (portrait) ─────────────────────────────────────────
const DEVICES = [
  { name: 'iPhone 16 Pro Max',   w: 1290, h: 2796, scale: 3, idiom: 'iphone' },
  { name: 'iPhone 16 Pro',       w: 1179, h: 2556, scale: 3, idiom: 'iphone' },
  { name: 'iPhone 16 Plus',      w: 1284, h: 2778, scale: 3, idiom: 'iphone' },
  { name: 'iPhone 16',           w: 1170, h: 2532, scale: 3, idiom: 'iphone' },
  { name: 'iPhone 12/13 Mini',   w: 1080, h: 2340, scale: 3, idiom: 'iphone' },
  { name: 'iPhone 11 Pro/XS/X',  w: 1125, h: 2436, scale: 3, idiom: 'iphone' },
  { name: 'iPhone 11/XR',        w: 828,  h: 1792, scale: 2, idiom: 'iphone' },
  { name: 'iPhone SE / 8',       w: 750,  h: 1334, scale: 2, idiom: 'iphone' },
  { name: 'iPad Pro 12.9"',      w: 2048, h: 2732, scale: 2, idiom: 'ipad' },
  { name: 'iPad Pro 11"',        w: 1668, h: 2388, scale: 2, idiom: 'ipad' },
  { name: 'iPad Air 10.9"',      w: 1640, h: 2360, scale: 2, idiom: 'ipad' },
  { name: 'iPad Mini',           w: 1488, h: 2266, scale: 2, idiom: 'ipad' },
];

// ─── Master splash SVG (rendered at 1290×2796, the largest size) ────────────
// The logo icon is 120px, wordmark is scaled proportionally.

function buildSplashSvg(w, h) {
  // Scale the logo proportionally to the screen width
  const iconSize = Math.round(w * 0.20);       // ~20% of screen width
  const textSize = Math.round(iconSize * 0.45); // wordmark text size
  const loadingSize = Math.round(iconSize * 0.28);
  const cx = Math.round(w / 2);
  const cyIcon = Math.round(h * 0.44);
  const cyText = cyIcon + Math.round(iconSize * 0.7);
  const cyLoading = cyText + Math.round(textSize * 1.6);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#312E81"/>

  <!-- Icon mark (centered) -->
  <g transform="translate(${cx - iconSize / 2}, ${cyIcon - iconSize / 2})">
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 48 48" fill="none">
      <polygon points="7,18 24,6 41,18" fill="white"/>
      <rect x="12" y="18" width="24" height="17" rx="2" fill="white" opacity="0.92"/>
      <path d="M19 35 L19 28 Q19 22 24 22 Q29 22 29 28 L29 35 Z" fill="#312E81"/>
      <rect x="22.5" y="27" width="3" height="6" rx="1.5" fill="white" opacity="0.30"/>
      <path d="M6 39.5 C14 34, 20 42, 24 39.5 C28 37, 34 42, 42 39.5" 
            stroke="#E8835C" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>
  </g>

  <!-- Wordmark: DukaFlow -->
  <text x="${cx}" y="${cyText}" text-anchor="middle"
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-weight="700" font-size="${textSize}" letter-spacing="-${Math.round(textSize * 0.02)}" fill="white">
    Duka<tspan fill="#E8835C">Flow</tspan>
  </text>

  <!-- Loading text -->
  <text x="${cx}" y="${cyLoading}" text-anchor="middle"
        font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        font-weight="400" font-size="${loadingSize}" fill="white" opacity="0.7">
    Loading…
  </text>
</svg>`;
}

// ═══════════════════════════════════════════════════════════════════════════════

async function generate() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('\n❌ sharp is not installed.\n   Run: npm install sharp --save-dev\n');
    process.exit(1);
  }

  const outDir = resolve(projectRoot, 'public/splash');
  mkdirSync(outDir, { recursive: true });

  for (const device of DEVICES) {
    const svg = buildSplashSvg(device.w, device.h);
    const filename = `splash-${device.w}x${device.h}.png`;
    const outPath = resolve(outDir, filename);

    await sharp(Buffer.from(svg))
      .resize(device.w, device.h)
      .png()
      .toFile(outPath);

    console.log(`✅ ${device.name.padEnd(22)} → ${filename}`);
  }

  console.log(`\n🎉 All ${DEVICES.length} splash screens generated in public/splash/`);
}

generate();
