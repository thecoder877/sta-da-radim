export class CommunityError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

export function publicError(code: string): {
  error: string;
  code: string;
  status: number;
} {
  const map: Record<string, { error: string; status: number }> = {
    AUTH_REQUIRED: { error: "Prijava je potrebna.", status: 401 },
    FORBIDDEN: { error: "Nemate pristup.", status: 403 },
    NOT_FOUND: { error: "Nije pronađeno.", status: 404 },
    USERNAME_TAKEN: { error: "To korisničko ime je zauzeto.", status: 409 },
    USERNAME_REQUIRED: { error: "Odaberi korisničko ime.", status: 400 },
    INVALID_REQUEST: { error: "Neispravan zahtev.", status: 400 },
    REVIEW_EXISTS: {
      error: "Već imaš recenziju za ovo mesto. Možeš je izmeniti.",
      status: 409,
    },
    PHOTO_LIMIT: { error: "Dostignut je limit fotografija.", status: 400 },
    FILE_TOO_LARGE: { error: "Fajl je prevelik.", status: 400 },
    FILE_TYPE: { error: "Dozvoljeni su JPG, PNG i WebP.", status: 400 },
    DUPLICATE_REPORT: { error: "Već si prijavio ovaj sadržaj.", status: 409 },
    SUPABASE_MISSING: { error: "Supabase nije podešen.", status: 503 },
  };
  const found = map[code] ?? { error: "Akcija nije uspela.", status: 400 };
  return { error: found.error, code, status: found.status };
}
