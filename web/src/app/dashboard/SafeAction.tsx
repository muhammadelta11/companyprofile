"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "./actions";

function emitToast(message: string) {
  try {
    sessionStorage.setItem("dash-toast", message);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("dash-toast", { detail: { message } }));
}

export function SafeAction({
  action,
  children,
  className = "btn btn-outline btn-sm",
  confirm,
}: {
  /** Harus Server Action (atau hasil .bind), bukan arrow function inline dari Server Component. */
  action: (...args: never[]) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <span className="safe-action">
      <button
        type="button"
        className={className}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => {
            const result = await action();
            setError(result?.error ?? null);
            if (result?.message) {
              emitToast(result.message);
              if (/Sandi sementara/i.test(result.message)) {
                window.alert(result.message);
              }
            }
          });
        }}
      >
        {pending ? "…" : children}
      </button>
      {error ? <span className="safe-action__err">{error}</span> : null}
    </span>
  );
}
