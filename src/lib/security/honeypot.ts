/**
 * Only the hidden company field is a bot signal.
 * A short elapsed time used to look like a bot, but password managers
 * autofill and submit well under 800ms and were treated as a successful
 * login without a session.
 */
export function isBotSubmission(input: {
  company?: string | null;
  startedAt?: number | null;
}): boolean {
  return Boolean(input.company && input.company.trim());
}
