import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [192, 512];
const inputImage = join(__dirname, '../public/clock.png');
const outputDir = join(__dirname, '../public');

// Ensure output directory exists
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

for (const size of sizes) {
  try {
    await sharp(inputImage)
      .resize(size, size)
      .png()
      .toFile(join(outputDir, `pwa-${size}x${size}.png`));
    console.log(`Generated ${size}x${size} icon`);
  } catch (err) {
    console.error(`Error generating ${size}x${size} icon:`, err);
  }
} 