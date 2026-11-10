"use client";

/** Baris ajakan membuka panel Delta (event global dari AppShell). */
export function AskDeltaRow() {
  return (
    <button
      type="button"
      className="mhome-delta"
      onClick={() => window.dispatchEvent(new Event("delta:open"))}
    >
      <span className="mhome-delta__orb" aria-hidden="true" />
      <span>
        <strong>Tanya Delta</strong>
        <small>Asisten AI bisnis — jawab cepat</small>
      </span>
      <span className="mhome-delta__go" aria-hidden="true">→</span>
    </button>
  );
}
