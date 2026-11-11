"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionResult } from "./actions";

export type FormDraft = Record<string, string>;

type FormState = {
  ok: boolean;
  error?: string;
  draft?: FormDraft;
  gen?: number;
};

function snapshotDraft(fd: FormData): FormDraft {
  const draft: FormDraft = {};
  fd.forEach((value, key) => {
    if (typeof value === "string") draft[key] = value;
  });
  return draft;
}

function restoreFields(form: HTMLFormElement, draft: FormDraft) {
  for (const [name, value] of Object.entries(draft)) {
    const el = form.elements.namedItem(name);
    if (!el || el instanceof RadioNodeList) continue;
    if (el instanceof HTMLInputElement) {
      if (el.type === "file" || el.type === "button" || el.type === "submit") continue;
      if (el.type === "checkbox") {
        el.checked = value === "on" || value === "true";
        continue;
      }
      el.value = value;
    } else if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
      el.value = value;
    }
  }
}

function emitRestore(key: string | undefined, draft: FormDraft) {
  window.dispatchEvent(
    new CustomEvent("dash-form-restore", { detail: { key: key ?? null, draft } })
  );
}

function emitToast(message: string) {
  window.dispatchEvent(new CustomEvent("dash-toast", { detail: { message } }));
}

export function SafeForm({
  action,
  children,
  className,
  persistKey,
  successMessage = "Tersimpan.",
}: {
  action: (fd: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  persistKey?: string;
  successMessage?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const storageKey = persistKey ? `dash-form:${persistKey}` : null;
  const successGen = useRef(0);

  useEffect(() => {
    if (!storageKey || !formRef.current) return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const draft = JSON.parse(raw) as FormDraft;
      restoreFields(formRef.current, draft);
      emitRestore(persistKey, draft);
      const details = formRef.current.closest("details");
      if (details) details.open = true;
    } catch {
      /* ignore */
    }
  }, [storageKey, persistKey]);

  const [state, formAction] = useActionState(
    async (_prev: FormState, fd: FormData): Promise<FormState> => {
      const draft = snapshotDraft(fd);

      if (storageKey) {
        try {
          sessionStorage.removeItem(storageKey);
        } catch {
          /* ignore */
        }
      }

      const result = await action(fd);
      if (result.error) {
        if (storageKey) {
          try {
            sessionStorage.setItem(storageKey, JSON.stringify(draft));
          } catch {
            /* ignore */
          }
        }
        return { ok: false, error: result.error, draft };
      }
      // Tutup panel edit + toast sebelum/saat remount refresh
      const details = formRef.current?.closest("details");
      if (details) details.open = false;
      const toastText = result.message || successMessage;
      try {
        sessionStorage.setItem("dash-toast", toastText);
      } catch {
        /* ignore */
      }
      window.setTimeout(() => emitToast(toastText), 50);
      if (result.message && /Sandi sementara/i.test(result.message)) {
        window.setTimeout(() => window.alert(result.message), 80);
      }
      successGen.current += 1;
      return { ok: true, gen: successGen.current };
    },
    { ok: false } satisfies FormState
  );

  useEffect(() => {
    if (!state.error || !state.draft || !formRef.current) return;
    restoreFields(formRef.current, state.draft);
    emitRestore(persistKey, state.draft);
    const details = formRef.current.closest("details");
    if (details) details.open = true;
  }, [state, persistKey]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className}
      data-persist-key={persistKey}
    >
      {children}
      {state.error ? (
        <p className="form-msg form-msg--error">
          {state.error}
          <br />
          <small>Isian teks & foto galeri sudah dipertahankan.</small>
        </p>
      ) : null}
    </form>
  );
}
