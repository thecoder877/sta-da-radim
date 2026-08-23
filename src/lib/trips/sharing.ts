import { slugify } from "@/lib/format";

export function createShareSlug(title: string): string {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  const base = slugify(title).slice(0, 36) || "putovanje";
  return `${base}-${suffix}`;
}
