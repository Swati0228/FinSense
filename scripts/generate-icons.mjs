import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.resolve(__dirname, '../public/icon-source.png');
const outputDir = path.resolve(__dirname, '../public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎨 Generating PWA icons from:', inputFile);

for (const size of sizes) {
  await sharp(inputFile)
    .resize(size, size, { fit: 'contain', background: { r: 15, g: 23, b: 42, alpha: 1 } })
    .png()
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
  console.log(`  ✅ icon-${size}x${size}.png`);
}

console.log('\n🚀 All icons generated in /public/icons/');
