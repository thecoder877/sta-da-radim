export function isBotSubmission(input: {
  company?: string | null;
  startedAt?: number | null;
}): boolean {
  if (input.company && input.company.trim()) {
    return true;
  }
  if (typeof input.startedAt === "number") {
    const elapsed = Date.now() - input.startedAt;
    if (elapsed >= 0 && elapsed < 800) {
      return true;
    }
  }
  return false;
}
