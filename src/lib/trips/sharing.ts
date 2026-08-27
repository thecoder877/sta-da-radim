import { slugify } from "@/lib/format";

export function createShareSlug(title: string): string {
  // 16 hex chars (~64 bits) so a public share link cannot be guessed.
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
  const base = slugify(title).slice(0, 36) || "putovanje";
  return `${base}-${suffix}`;
}
