export const UTM_STORAGE_KEY = "sdr_utm";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

export interface StoredUtm extends UtmParams {
  capturedAt: string;
}

/** Extract the utm_* params from a query string. Pure and testable. */
export function parseUtmFromSearch(search: string): UtmParams {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const result: UtmParams = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      result[key] = value.slice(0, 200);
    }
  }
  return result;
}

export function getStoredUtm(): StoredUtm | null {
  try {
    const raw = window.localStorage.getItem(UTM_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredUtm) : null;
  } catch {
    return null;
  }
}

/**
 * First-touch UTM capture: store the campaign params from the current URL the
 * first time they appear, so later conversions can be attributed.
 */
export function captureUtmParams(search: string = window.location.search): void {
  const parsed = parseUtmFromSearch(search);
  if (Object.keys(parsed).length === 0) {
    return;
  }
  try {
    if (window.localStorage.getItem(UTM_STORAGE_KEY)) {
      return;
    }
    const payload: StoredUtm = { ...parsed, capturedAt: new Date().toISOString() };
    window.localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable; ignore.
  }
}
