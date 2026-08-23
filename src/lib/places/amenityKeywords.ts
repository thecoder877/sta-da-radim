import { foldSerbian } from "@/lib/format";

export type AmenityKind =
  | "pool"
  | "restaurant"
  | "cafe"
  | "spa"
  | "lake"
  | "monastery"
  | "museum"
  | "park"
  | "beach"
  | "viewpoint"
  | "fortress"
  | "nightlife"
  | "sport";

const AMENITY_PATTERNS: { kind: AmenityKind; pattern: RegExp }[] = [
  {
    kind: "pool",
    pattern:
      /\b(bazen(i|a)?|pool|kupanje|plivaliste|aqua\s*park|akva\s*park|water\s*park)\b/,
  },
  { kind: "spa", pattern: /\b(spa|wellness|banja|sauna|termal)\b/ },
  { kind: "restaurant", pattern: /\b(restoran(i|a)?|restaurant|hrana|rucak|vecera)\b/ },
  { kind: "cafe", pattern: /\b(kafic(i|a)?|kafana|cafe|kafa|kavane?)\b/ },
  { kind: "lake", pattern: /\b(jezer(o|a|u)|lake)\b/ },
  { kind: "monastery", pattern: /\b(manastir(i|a)?|monastery)\b/ },
  { kind: "museum", pattern: /\b(muzej(i|a)?|museum|galerij(a|e))\b/ },
  { kind: "park", pattern: /\b(park(ovi|a)?|bast(a|e)|garden)\b/ },
  { kind: "beach", pattern: /\b(plaz(a|e)|beach|splaviste)\b/ },
  { kind: "viewpoint", pattern: /\b(vidikov(ac|ci)|viewpoint|pogled)\b/ },
  { kind: "fortress", pattern: /\b(tvrdjav(a|e)|fortress|bedem(i)?|kalemegdan)\b/ },
  { kind: "nightlife", pattern: /\b(klub(ovi)?|splav(ovi)?|nocni|bar(ovi)?)\b/ },
  { kind: "sport", pattern: /\b(sport(ski)?|hala|stadion|teren)\b/ },
];

const FILLER = new Set(["u", "na", "kod", "pored", "za", "the", "in", "near", "oko", "i"]);

export interface ParsedExploreQuery {
  original: string;
  folded: string;
  amenity?: AmenityKind;
  locationQuery: string;
}

export function parseExploreQuery(raw: string): ParsedExploreQuery {
  const original = raw.trim();
  const folded = foldSerbian(original).replace(/\s+/g, " ");
  let remaining = folded;
  let amenity: AmenityKind | undefined;

  for (const entry of AMENITY_PATTERNS) {
    if (entry.pattern.test(remaining)) {
      amenity = entry.kind;
      remaining = remaining.replace(entry.pattern, " ");
      break;
    }
  }

  const locationQuery = remaining
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part && !FILLER.has(part))
    .join(" ")
    .trim();

  return { original, folded, amenity, locationQuery };
}

export function placeMatchesAmenity(place: {
  name: string;
  category: string;
  tags: string[];
  shortDescription?: string;
}, amenity: AmenityKind): boolean {
  const blob = foldSerbian(
    `${place.name} ${place.category} ${place.tags.join(" ")} ${place.shortDescription ?? ""}`,
  );

  const needles: Record<AmenityKind, string[]> = {
    pool: ["bazen", "pool", "kupanje", "aqua", "akva", "plival"],
    spa: ["spa", "wellness", "banja", "sauna", "termal"],
    restaurant: ["restoran", "hrana", "rucak"],
    cafe: ["kafic", "kafana", "cafe", "kafa"],
    lake: ["jezer", "lake"],
    monastery: ["manastir", "istorija"],
    museum: ["muzej", "galerij"],
    park: ["park", "bast"],
    beach: ["plaz", "beach"],
    viewpoint: ["vidikov", "pogled"],
    fortress: ["tvrdjav", "fort", "bedem", "kalemegdan"],
    nightlife: ["klub", "splav", "bar", "nocni"],
    sport: ["sport", "hala", "stadion"],
  };

  return needles[amenity].some((needle) => blob.includes(needle));
}
