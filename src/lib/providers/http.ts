export const DEFAULT_FETCH_TIMEOUT_MS = 8000;

/**
 * fetch() with an automatic abort timeout so a slow/hanging upstream (OSRM,
 * Nominatim, Overpass, Google) can never stall trip generation indefinitely.
 * On timeout the returned promise rejects, which existing try/catch blocks
 * already handle by falling back to the next mirror or a null result.
 */
export function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<Response> {
  return fetch(input, {
    ...init,
    signal: init.signal ?? AbortSignal.timeout(timeoutMs),
  });
}
