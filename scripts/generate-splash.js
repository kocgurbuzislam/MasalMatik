// Generates a splash image from assets/icon.png using a branded background.
// Requires: npm i -D sharp
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ICON = path.resolve('assets/icon.png');
const OUT = path.resolve('assets/splash.png');
const BG = '#FFF7E6';

const WIDTH = 1242; // iPhone X portrait width (3x)
const HEIGHT = 2436; // iPhone X portrait height (3x)

async function run() {
  if (!fs.existsSync(ICON)) {
    console.error('Missing assets/icon.png');
    process.exit(1);
  }

  // Create background canvas
  const canvas = sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: BG,
    },
  });

  // Scale icon to fit within safe area (about 55% of width)
  const maxIconWidth = Math.round(WIDTH * 0.55);
  const iconBuffer = await sharp(ICON).resize({ width: maxIconWidth }).toBuffer();

  // Composite icon centered
  const result = await canvas
    .composite([
      {
        input: iconBuffer,
        gravity: 'center',
      },
    ])
    .png()
    .toFile(OUT);

  console.log('Splash generated at', OUT);
}

run().catch((e) => {
  console.error('Failed to generate splash:', e);
  process.exit(1);
});

