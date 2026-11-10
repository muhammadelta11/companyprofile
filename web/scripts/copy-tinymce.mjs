import { cpSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "tinymce");
const dest = join(root, "public", "tinymce");

if (!existsSync(src)) {
  console.warn("tinymce belum terpasang — lewati copy.");
  process.exit(0);
}

rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log("TinyMCE disalin ke public/tinymce");
