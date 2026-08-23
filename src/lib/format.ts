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
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
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

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
