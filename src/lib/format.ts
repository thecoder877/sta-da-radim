import { format, parseISO } from "date-fns";
import { srLatn } from "date-fns/locale";
import type { TransportType } from "@/types/trip";

export function formatRsd(amount: number): string {
  return `${new Intl.NumberFormat("sr-Latn-RS").format(Math.round(amount))} RSD`;
}

export function formatDistance(km: number): string {
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

export function formatDurationMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) {
    return `${total} min`;
  }

  const days = Math.floor(total / (60 * 24));
  const hours = Math.floor((total % (60 * 24)) / 60);
  const remaining = total % 60;

  if (days > 0) {
    const dayLabel = days === 1 ? "1 dan" : `${days} dana`;
    return hours > 0 ? `${dayLabel} ${hours}h` : dayLabel;
  }

  if (remaining === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remaining}min`;
}

export function formatTravelTime(minutes: number, transport: TransportType): string {
  const duration = formatDurationMinutes(minutes);
  if (transport === "car") {
    return `~${duration} vožnje`;
  }
  if (transport === "walk") {
    return `~${duration} hoda`;
  }
  if (transport === "bike") {
    return `~${duration} vožnje biciklom`;
  }
  return `~${duration} putovanja`;
}

export function formatTripDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), "d. MMMM yyyy.", { locale: srLatn });
  } catch {
    return isoDate;
  }
}

export function formatDayLabel(days: number, preset?: string): string {
  if (preset === "hours") {
    return "Nekoliko sati";
  }
  if (days === 1) {
    return "1 dan";
  }
  return `${days} dana`;
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  ђ: "dj",
  е: "e",
  ж: "z",
  з: "z",
  и: "i",
  ј: "j",
  к: "k",
  л: "l",
  љ: "lj",
  м: "m",
  н: "n",
  њ: "nj",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  ћ: "c",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "c",
  џ: "dz",
  ш: "s",
};

export function foldSerbian(value: string): string {
  return value
    .toLowerCase()
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "dj");
}

export function slugify(value: string): string {
  return (
    foldSerbian(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "mesto"
  );
}
