import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const icon = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const transparent = icon.replace(/<rect\b[^>]*\/>/, '');
if (transparent === icon) throw new Error('The app icon no longer has its expected background rectangle. Review the transparent logo export.');

const directory = new URL('../public/branding/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const [filename, source] of [['u-ikigai-logo.png', transparent], ['u-ikigai-icon.png', icon]]) {
  const output = new URL(filename, directory);
  await sharp(Buffer.from(source), { density: 768 }).resize(1024, 1024).png().toFile(fileURLToPath(output));
  console.log(`Exported ${filename} (1024 × 1024) from public/icon.svg`);
}
