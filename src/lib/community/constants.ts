export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export const PARKING_OPTIONS = [
  { id: "easy", label: "Lak" },
  { id: "average", label: "Osrednji" },
  { id: "difficult", label: "Težak" },
  { id: "unknown", label: "Ne znam" },
] as const;

export const CROWD_OPTIONS = [
  { id: "low", label: "Mala gužva" },
  { id: "medium", label: "Srednja" },
  { id: "high", label: "Velika" },
] as const;

export const RECOMMENDED_FOR_OPTIONS = [
  { id: "couples", label: "Parove" },
  { id: "families", label: "Porodice" },
  { id: "children", label: "Decu" },
  { id: "solo", label: "Solo" },
  { id: "friends", label: "Društvo" },
  { id: "photography", label: "Fotografiju" },
  { id: "hiking", label: "Planinarenje" },
] as const;

export const REPORT_REASONS = [
  { id: "spam", label: "Spam" },
  { id: "offensive", label: "Uvredljivo" },
  { id: "incorrect_information", label: "Netačne informacije" },
  { id: "irrelevant", label: "Nije relevantno" },
  { id: "fake_review", label: "Lažna recenzija" },
  { id: "copyright", label: "Autorska prava / privatnost" },
  { id: "other", label: "Drugo" },
] as const;

export const EDITABLE_PLACE_FIELDS = [
  { id: "opening_hours", label: "Radno vreme" },
  { id: "phone", label: "Telefon" },
  { id: "website", label: "Website" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "address", label: "Adresa" },
  { id: "price_info", label: "Cena" },
  { id: "parking_info", label: "Parking" },
  { id: "estimated_duration_minutes", label: "Trajanje posete" },
  { id: "description", label: "Opis" },
  { id: "short_description", label: "Kratak opis" },
  { id: "category", label: "Kategorija" },
  { id: "family_friendly", label: "Porodično" },
  { id: "pet_friendly", label: "Pet friendly" },
  { id: "accessibility_notes", label: "Pristupačnost" },
  { id: "latitude", label: "Geografska širina" },
  { id: "longitude", label: "Geografska dužina" },
] as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: "Čeka odobrenje",
  approved: "Odobreno",
  rejected: "Odbijeno",
  removed: "Uklonjeno",
  hidden: "Sakriveno",
  published: "Objavljeno",
  visible: "Vidljivo",
  open: "Otvoreno",
  resolved: "Rešeno",
  dismissed: "Odbačeno",
};

export const MAX_REVIEW_PHOTOS = 5;
export const MAX_PLACE_PHOTOS = 8;
export const MAX_SUBMISSION_PHOTOS = 6;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function publicLabel(value: string | null | undefined): string {
  return value ? (STATUS_LABELS[value] ?? value) : "Nije poznato";
}
