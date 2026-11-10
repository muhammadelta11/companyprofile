// Membuat semua ikon aplikasi (PWA, favicon, Apple) dari satu tanda "M".
// Jalankan ulang dengan `npm run icons` setiap kali desain ikon berubah.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = new URL("../", import.meta.url);

function mark({ rounded = true, ring = true, stroke = 46 } = {}) {
  const rx = rounded ? 116 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2563eb"/>
      <stop offset="1" stop-color="#0b2a6f"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.28" cy="0.18" r="0.85">
      <stop offset="0" stop-color="#38bdf8" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#38bdf8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="${rx}" fill="url(#bg)"/>
  <rect width="512" height="512" rx="${rx}" fill="url(#glow)"/>${
    ring
      ? `
  <circle cx="256" cy="256" r="178" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="6"/>
  <circle cx="382" cy="130" r="20" fill="#7dd3fc"/>`
      : ""
  }
  <path d="M166 340V172l90 94 90-94v168" fill="none" stroke="#fff" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

/** ICO berisi PNG (didukung semua browser modern). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const app = mark();
const bleed = mark({ rounded: false });
const small = mark({ ring: false, stroke: 58 });

await mkdir(new URL("public/icons/", root), { recursive: true });

const outputs = {
  "public/icons/icon-192.png": await png(app, 192),
  "public/icons/icon-512.png": await png(app, 512),
  "public/icons/maskable-512.png": await png(bleed, 512),
  "src/app/apple-icon.png": await png(bleed, 180),
  "src/app/icon.svg": Buffer.from(small),
  "src/app/favicon.ico": ico(
    await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(small, size) })))
  ),
};

for (const [file, data] of Object.entries(outputs)) {
  await writeFile(new URL(file, root), data);
  console.log(`${file}  ${(data.length / 1024).toFixed(1)} KB`);
}

// Thread pool sharp di Windows kadang menahan proses tetap hidup.
process.exit(0);
