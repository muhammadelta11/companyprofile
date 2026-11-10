"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useEffect, useId, useRef, useState } from "react";

type EditorApi = { setContent: (html: string) => void };

/**
 * TinyMCE self-hosted (tanpa API key). Nilai disimpan ke textarea tersembunyi
 * supaya ikut terkirim lewat FormData server action.
 * Gambar diunggah ke /api/upload/image → Supabase Storage.
 */
export function RichTextEditor({
  name,
  label,
  defaultValue = "",
  height = 320,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  height?: number;
}) {
  const id = useId();
  const editorRef = useRef<EditorApi | null>(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    const onRestore = (event: Event) => {
      const draft = (event as CustomEvent<{ draft?: Record<string, string> }>).detail?.draft;
      const html = draft?.[name];
      if (typeof html !== "string") return;
      setValue(html);
      editorRef.current?.setContent(html);
    };
    window.addEventListener("dash-form-restore", onRestore);
    return () => window.removeEventListener("dash-form-restore", onRestore);
  }, [name]);

  return (
    <div className="rte">
      <span className="rte__label">{label}</span>
      <textarea id={id} name={name} value={value} readOnly hidden aria-hidden="true" tabIndex={-1} />
      <Editor
        id={`${id}-editor`}
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        initialValue={defaultValue}
        onInit={(_evt, editor) => {
          editorRef.current = editor;
        }}
        onEditorChange={(content) => setValue(content)}
        init={{
          height,
          menubar: false,
          branding: false,
          promotion: false,
          plugins: "lists link code autoresize image",
          toolbar:
            "undo redo | blocks | bold italic underline | bullist numlist | link image | removeformat | code",
          block_formats: "Paragraf=p; Judul 2=h2; Judul 3=h3",
          content_style:
            "body{font-family:Plus Jakarta Sans,system-ui,sans-serif;font-size:14px;line-height:1.55;color:#0b1220}" +
            " a{color:#1d4ed8} img{max-width:100%;height:auto;border-radius:8px;margin:0.5rem 0}",
          link_default_target: "_blank",
          link_assume_external_targets: true,
          relative_urls: false,
          convert_urls: true,
          automatic_uploads: true,
          images_reuse_filename: false,
          image_title: true,
          image_description: false,
          image_dimensions: false,
          file_picker_types: "image",
          images_file_types: "jpeg,jpg,png,gif,webp",
          images_upload_handler: async (blobInfo) => {
            const body = new FormData();
            body.append("file", blobInfo.blob(), blobInfo.filename());
            const res = await fetch("/api/upload/image", { method: "POST", body });
            const data = (await res.json().catch(() => ({}))) as {
              location?: string;
              error?: string;
            };
            if (!res.ok || !data.location) {
              throw new Error(data.error || "Gagal mengunggah gambar.");
            }
            return data.location;
          },
          skin_url: "/tinymce/skins/ui/oxide",
          content_css: "/tinymce/skins/content/default/content.min.css",
        }}
      />
      <small className="rte__hint">Bisa sisipkan gambar (JPG/PNG/WebP/GIF, maks. 5 MB) — dikompres otomatis.</small>
    </div>
  );
}
