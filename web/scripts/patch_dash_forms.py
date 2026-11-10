from pathlib import Path
import re

root = Path(__file__).resolve().parents[1] / "src" / "app" / "dashboard"

replacements = {
    "produk/page.tsx": [
        (
            'import { SubmitButton } from "../SubmitButton";',
            'import { SubmitButton } from "../SubmitButton";\nimport { SafeForm } from "../SafeForm";\nimport { SafeAction } from "../SafeAction";',
        ),
        ('<form action={saveProduct} className="form-stack">', '<SafeForm action={saveProduct} className="form-stack">'),
        ("      <SubmitButton>{product ? \"Simpan perubahan\" : \"Tambah produk\"}</SubmitButton>\n    </form>",
         "      <SubmitButton>{product ? \"Simpan perubahan\" : \"Tambah produk\"}</SubmitButton>\n    </SafeForm>"),
    ],
}

# More thorough: process each page manually with targeted patterns

def patch_produk(text: str) -> str:
    text = text.replace(
        'import { SubmitButton } from "../SubmitButton";',
        'import { SubmitButton } from "../SubmitButton";\nimport { SafeForm } from "../SafeForm";\nimport { SafeAction } from "../SafeAction";',
    )
    text = text.replace('<form action={saveProduct} className="form-stack">', '<SafeForm action={saveProduct} className="form-stack">')
    text = text.replace(
        '      <SubmitButton>{product ? "Simpan perubahan" : "Tambah produk"}</SubmitButton>\n    </form>',
        '      <SubmitButton>{product ? "Simpan perubahan" : "Tambah produk"}</SubmitButton>\n    </SafeForm>',
    )
    old = '''              <form className="dash-row__actions">
                {isAdmin && p.status !== "approved" ? (
                  <SubmitButton formAction={setProductStatus.bind(null, p.id, "approved")}>
                    Setujui
                  </SubmitButton>
                ) : null}
                {isAdmin && p.status === "pending" ? (
                  <SubmitButton
                    className="btn btn-outline btn-sm"
                    formAction={setProductStatus.bind(null, p.id, "rejected")}
                  >
                    Tolak
                  </SubmitButton>
                ) : null}
                <SubmitButton
                  className="btn btn-danger btn-sm"
                  confirm={`Hapus "${p.title}"?`}
                  formAction={deleteProduct.bind(null, p.id)}
                >
                  Hapus
                </SubmitButton>
              </form>'''
    new = '''              <div className="dash-row__actions">
                {isAdmin && p.status !== "approved" ? (
                  <SafeAction action={() => setProductStatus(p.id, "approved")}>
                    Setujui
                  </SafeAction>
                ) : null}
                {isAdmin && p.status === "pending" ? (
                  <SafeAction
                    className="btn btn-outline btn-sm"
                    action={() => setProductStatus(p.id, "rejected")}
                  >
                    Tolak
                  </SafeAction>
                ) : null}
                <SafeAction
                  className="btn btn-danger btn-sm"
                  confirm={`Hapus "${p.title}"?`}
                  action={() => deleteProduct(p.id)}
                >
                  Hapus
                </SafeAction>
              </div>'''
    if old not in text:
        raise SystemExit("produk actions block missing")
    return text.replace(old, new)


def patch_simple_save(path_rel: str, save_name: str, delete_name: str, item_var: str, title_expr: str, label_save: str):
    p = root / path_rel
    text = p.read_text(encoding="utf-8")
    text = text.replace(
        'import { SubmitButton } from "../SubmitButton";',
        'import { SubmitButton } from "../SubmitButton";\nimport { SafeForm } from "../SafeForm";\nimport { SafeAction } from "../SafeAction";',
    )
    text = text.replace(f'<form action={{{save_name}}} className="form-stack">', f'<SafeForm action={{{save_name}}} className="form-stack">')
    # closing SafeForm for save forms - last SubmitButton then </form> in Form component
    text = re.sub(
        rf'(<SubmitButton>\{{[^}}]+\}}</SubmitButton>)\n    </form>',
        r'\1\n    </SafeForm>',
        text,
        count=1,
    )
    # delete block
    pattern = rf'''              <form className="dash-row__actions">
                <SubmitButton
                  className="btn btn-danger btn-sm"
                  confirm=\{{`Hapus[^`]+`\}}
                  formAction={{{delete_name}\.bind\(null, {item_var}\.id\)}}
                >
                  Hapus
                </SubmitButton>
              </form>'''
    repl = f'''              <div className="dash-row__actions">
                <SafeAction
                  className="btn btn-danger btn-sm"
                  confirm={{`Hapus "${{{title_expr}}}"?`}}
                  action={{() => {delete_name}({item_var}.id)}}
                >
                  Hapus
                </SafeAction>
              </div>'''
    text2, n = re.subn(pattern, repl, text, count=1)
    if n != 1:
        raise SystemExit(f"delete block fail {path_rel}")
    p.write_text(text2, encoding="utf-8")
    print("patched", path_rel)


produk = root / "produk/page.tsx"
produk.write_text(patch_produk(produk.read_text(encoding="utf-8")), encoding="utf-8")
print("patched produk")

patch_simple_save("wisata/page.tsx", "saveTrip", "deleteTrip", "t", "t.title", "")
patch_simple_save("proyek/page.tsx", "saveProject", "deleteProject", "p", "p.title", "")
