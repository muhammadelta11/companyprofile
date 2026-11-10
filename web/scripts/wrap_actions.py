from pathlib import Path
import re

p = Path(__file__).resolve().parents[1] / "src" / "app" / "dashboard" / "actions.ts"
src = p.read_text(encoding="utf-8")

old = '''"use server";

import { refresh, updateTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Supa = Awaited<ReturnType<typeof createClient>>;
'''

new = '''"use server";

import { refresh, updateTag } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string };

type Supa = Awaited<ReturnType<typeof createClient>>;

function friendlyError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Terjadi kesalahan.";
  if (/NEXT_REDIRECT|NEXT_HTTP_ERROR_FALLBACK/.test(msg)) throw e;
  if (/JWT|RLS|policy|permission denied|row-level|duplicate key|violates/i.test(msg)) {
    return "Aksi ditolak. Periksa hak akses atau data yang diisi.";
  }
  return msg;
}

async function act(work: () => Promise<void>): Promise<ActionResult> {
  try {
    await work();
    return {};
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return { error: friendlyError(e) };
  }
}
'''

if old not in src:
    raise SystemExit("header not found")
src = src.replace(old, new, 1)

names = {
    "saveProduct",
    "setProductStatus",
    "deleteProduct",
    "setOrderStatus",
    "setApplicationStatus",
    "deleteApplication",
    "updateMember",
    "updateProfile",
    "saveTrip",
    "deleteTrip",
    "saveProject",
    "deleteProject",
    "saveFaq",
    "deleteFaq",
    "deleteDeltaLog",
}

out: list[str] = []
i = 0
text = src
while True:
    m = re.search(r"export async function (\w+)\(([^)]*)\)(?:\s*:\s*[^{]+)?\s*\{", text[i:])
    if not m:
        out.append(text[i:])
        break
    start = i + m.start()
    out.append(text[i:start])
    name = m.group(1)
    args = m.group(2)
    brace_start = i + m.end() - 1
    depth = 0
    j = brace_start
    while j < len(text):
        ch = text[j]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                break
        j += 1
    body = text[brace_start + 1 : j]
    if name in names:
        lines = body.strip("\n").split("\n")
        indented = "\n".join(("    " + line if line.strip() else line) for line in lines)
        out.append(
            f"export async function {name}({args}): Promise<ActionResult> {{\n"
            f"  return act(async () => {{\n{indented}\n  }});\n}}"
        )
    else:
        out.append(text[start : j + 1])
    i = j + 1

p.write_text("".join(out), encoding="utf-8")
print("ok")
