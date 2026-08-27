export const AUTH_FETCH_TIMEOUT_MS = 12_000;

export function authFetchSignal(timeoutMs = AUTH_FETCH_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}
