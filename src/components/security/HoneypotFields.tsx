"use client";

export function HoneypotFields({ startedAt }: { startedAt: number }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="company">Kompanija</label>
      <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      <input type="hidden" name="startedAt" value={String(startedAt)} readOnly />
    </div>
  );
}
