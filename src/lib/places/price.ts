import { formatRsd } from "@/lib/format";
import type { Place } from "@/types/place";

export function resolvePlacePrice(
  place: Place,
  overlay?: { priceInfo?: string | null },
): string | null {
  const info = overlay?.priceInfo?.trim();
  if (info) {
    return info;
  }
  if (
    typeof place.estimatedCostPerPerson === "number" &&
    place.estimatedCostPerPerson > 0
  ) {
    return formatRsd(place.estimatedCostPerPerson);
  }
  if (place.estimatedCostPerPerson === 0) {
    return "Besplatno";
  }
  return null;
}
