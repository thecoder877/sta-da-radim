import { getPlaceBySlug } from "@/data/mockPlaces";
import type { GeneratedTrip, TripStop } from "@/types/trip";

function requiredPlace(slug: string) {
  const place = getPlaceBySlug(slug);
  if (!place) {
    throw new Error(`Missing demo place: ${slug}`);
  }
  return place;
}

function stop(
  slug: string,
  arrivalTime: string,
  durationMinutes: number,
  reason: string,
  estimatedCost?: number,
): TripStop {
  const place = requiredPlace(slug);
  return {
    id: `demo-${slug}`,
    placeId: place.id,
    place,
    arrivalTime,
    departureTime: undefined,
    durationMinutes,
    reason,
    estimatedCost,
  };
}

const stops: TripStop[] = [
  stop(
    "strazilovo",
    "09:45",
    75,
    "Kratak izlazak u šumu odmah posle Rume, da se dan otvori vazduhom a ne gradom.",
  ),
  stop(
    "sremski-karlovci",
    "11:30",
    60,
    "Barokni centar i lagana šetnja pre ručka, na pola puta ka Novom Sadu.",
    800,
  ),
  stop(
    "vinarija-sremski-karlovci",
    "13:30",
    75,
    "Ručak u vinogradarskom gradiću — bermet, lokalna kuhinja i predah.",
    5000,
  ),
  stop(
    "petrovaradinska-tvrdjava",
    "15:30",
    90,
    "Popodne na bedemima, sa pogledom na Dunav i krovove Novog Sada.",
  ),
  stop(
    "centar-novog-sada",
    "18:00",
    90,
    "Zatvaranje dana kafom i šetnjom kroz Zmaj Jovinu.",
    2700,
  ),
];

export const DEMO_TRIP: GeneratedTrip = {
  id: "demo",
  title: "Fruška gora & Novi Sad",
  description:
    "Jednodnevni izlet iz Rume: šuma na Stražilovu, Karlovci, ručak i zalazak na Petrovaradinu. Procene su orijentacione.",
  startLocation: "Ruma",
  startDate: "2026-08-29",
  days: 1,
  transport: "car",
  totalDistanceKm: 110,
  totalTravelMinutes: 120,
  estimatedTotalCost: 8500,
  stops,
  daysPlan: [
    {
      dayNumber: 1,
      date: "2026-08-29",
      stops,
    },
  ],
  createdAt: "2026-08-23T10:00:00.000Z",
  shareSlug: "fruska-gora-novi-sad-demo",
  isPublic: true,
};
