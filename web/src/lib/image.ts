import sharp from "sharp";

/** Batas unggahan mentah (sebelum kompresi). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Setelah diproses, simpan sebagai WebP agar ringan & aman. */
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1600;
const WEBP_QUALITY = 78;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/** Magic bytes — jangan percaya MIME dari browser saja. */
function sniffImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // PNG
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
    return true;
  // GIF
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true;
  // WEBP (RIFF....WEBP)
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return true;
  // AVIF / HEIC-ish ftyp
  if (buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70)
    return true;
  return false;
}

export type ProcessedImage = {
  buffer: Buffer;
  contentType: "image/webp";
  ext: "webp";
  width: number;
  height: number;
  bytes: number;
};

/**
 * Validasi + kompres gambar:
 * - cek ukuran & tipe (MIME + magic bytes)
 * - putar sesuai EXIF, buang metadata
 * - batasi dimensi, encode WebP
 */
export async function processUploadImage(file: File): Promise<ProcessedImage> {
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("File gambar kosong.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Ukuran gambar maksimal 5 MB (akan dikompres otomatis).");
  }
  if (file.type && !ALLOWED_MIME.has(file.type) && !file.type.startsWith("image/")) {
    throw new Error("Format tidak didukung. Pakai JPG, PNG, WebP, atau GIF.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  if (!sniffImage(input)) {
    throw new Error("File bukan gambar valid (atau tipe disamarkan).");
  }

  const meta = await sharp(input, {
    failOn: "error",
    animated: false,
    limitInputPixels: 40_000_000,
  }).metadata();

  if (!meta.width || !meta.height) {
    throw new Error("Gambar tidak bisa dibaca.");
  }
  if (meta.width > 8000 || meta.height > 8000) {
    throw new Error("Resolusi terlalu besar (maks. 8000px).");
  }

  const out = await sharp(input, {
    failOn: "error",
    animated: false,
    limitInputPixels: 40_000_000,
  })
    .rotate() // hormati EXIF orientation; metadata dibuang saat encode
    .resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  if (out.info.size > 1.5 * 1024 * 1024) {
    const tighter = await sharp(out.data)
      .webp({ quality: 65, effort: 5 })
      .toBuffer({ resolveWithObject: true });
    return {
      buffer: tighter.data,
      contentType: "image/webp",
      ext: "webp",
      width: tighter.info.width,
      height: tighter.info.height,
      bytes: tighter.info.size,
    };
  }

  return {
    buffer: out.data,
    contentType: "image/webp",
    ext: "webp",
    width: out.info.width,
    height: out.info.height,
    bytes: out.info.size,
  };
}
