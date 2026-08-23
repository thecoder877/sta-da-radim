/**
 * Auth helpers for Phase 4. Anonymous visitors can explore and generate
 * temporary trips. Login is required only to save, review, or submit places.
 */
export async function getCurrentUser() {
  return null;
}

export function isAuthRequiredFor(action: "save" | "review" | "submit") {
  return action === "save" || action === "review" || action === "submit";
}
