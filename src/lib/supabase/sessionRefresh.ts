/**
 * Auth API routes (and other /api handlers) call supabase.auth.getUser()
 * themselves. Refreshing the session again in proxy/middleware on the same
 * request can deadlock @supabase/ssr cookie writes and leave the browser
 * waiting forever with no console error.
 */
export function shouldRefreshAuthSession(pathname: string): boolean {
  return !pathname.startsWith("/api/");
}
