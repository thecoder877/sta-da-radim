export function sanitizeSearch(value: string | null | undefined, max = 80): string {
  if (!value) {
    return "";
  }
  return value
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .trim()
    .slice(0, max);
}
