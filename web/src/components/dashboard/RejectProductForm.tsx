"use client";

import { useActionState } from "react";
import { rejectProduct, type ActionResult } from "@/app/dashboard/actions";

export function RejectProductForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(
    async (_prev: ActionResult, fd: FormData) => rejectProduct(fd),
    {} as ActionResult
  );

  return (
    <details className="reject-form">
      <summary className="btn btn-outline btn-sm">Tolak…</summary>
      <form action={action} className="form-stack reject-form__body">
        <input type="hidden" name="id" value={productId} />
        <label>
          Alasan penolakan
          <textarea
            name="reject_reason"
            required
            rows={2}
            maxLength={500}
            placeholder="Mis. foto kurang jelas, deskripsi tidak lengkap…"
          />
        </label>
        <button type="submit" className="btn btn-danger btn-sm" disabled={pending}>
          {pending ? "…" : "Tolak produk"}
        </button>
        {state.error ? <p className="form-msg form-msg--error">{state.error}</p> : null}
      </form>
    </details>
  );
}
