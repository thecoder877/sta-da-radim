function contentSecurityPolicy(production: boolean): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https: wss:",
    "frame-src https://www.google.com https://maps.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  if (production) {
    directives.push("frame-ancestors 'none'");
  }
  return directives.join("; ");
}

export function securityHeaders(production: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "X-DNS-Prefetch-Control": "off",
    "Content-Security-Policy": contentSecurityPolicy(production),
  };
  if (production) {
    headers["X-Frame-Options"] = "DENY";
    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }
  return headers;
}

export function applySecurityHeaders(headers: Headers, production = process.env.NODE_ENV === "production") {
  for (const [key, value] of Object.entries(securityHeaders(production))) {
    headers.set(key, value);
  }
}
