import type { DurationPreset, TransportType, TravelStyle } from "@/types/trip";
import type { Coordinates } from "@/types/place";

export const APP_NAME = "Šta da radim?";

export const CONTACT_EMAIL = "podrska@stadaradim.rs";

// Shown in the footer as the "last updated" date. Bump when the site changes.
export const SITE_LAST_UPDATED = "2026-08-27";

export const SERBIA_CENTER: Coordinates = {
  latitude: 44.2,
  longitude: 20.8,
};

export const SERBIA_BOUNDS = {
  west: 18.8,
  south: 42.2,
  east: 23.0,
  north: 46.2,
};

export const INTERESTS = [
  { id: "priroda", label: "Priroda" },
  { id: "planinarenje", label: "Planinarenje" },
  { id: "restorani", label: "Restorani" },
  { id: "kafici", label: "Kafići" },
  { id: "istorija", label: "Istorija" },
  { id: "muzeji", label: "Muzeji" },
  { id: "jezera", label: "Jezera" },
  { id: "kupanje", label: "Kupanje" },
  { id: "vidikovci", label: "Vidikovci" },
  { id: "fotografija", label: "Fotografija" },
  { id: "avantura", label: "Avantura" },
  { id: "spa", label: "Spa" },
  { id: "nocni-zivot", label: "Noćni život" },
  { id: "vino", label: "Vino" },
  { id: "manastiri", label: "Manastiri" },
  { id: "skrivena-mesta", label: "Skrivena mesta" },
  { id: "porodicno", label: "Porodično" },
  { id: "romanticno", label: "Romantično" },
] as const;

export const CATEGORIES = [
  { id: "priroda", label: "Priroda" },
  { id: "hrana", label: "Hrana" },
  { id: "istorija", label: "Istorija" },
  { id: "avantura", label: "Avantura" },
  { id: "wellness", label: "Wellness" },
  { id: "nocni-zivot", label: "Noćni život" },
  { id: "porodicno", label: "Porodično" },
  { id: "romanticno", label: "Romantično" },
  { id: "skrivena-mesta", label: "Skrivena mesta" },
  { id: "fotografija", label: "Fotografija" },
] as const;

export const DURATION_OPTIONS: {
  id: DurationPreset;
  label: string;
  days: number;
}[] = [
  { id: "hours", label: "Nekoliko sati", days: 1 },
  { id: "1", label: "1 dan", days: 1 },
  { id: "2", label: "2 dana", days: 2 },
  { id: "3", label: "3 dana", days: 3 },
  { id: "4plus", label: "4+ dana", days: 4 },
];

export const BUDGET_OPTIONS = [
  { id: "unlimited", label: "Bez ograničenja", value: undefined },
  { id: "5000", label: "Do 5.000 RSD", value: 5000 },
  { id: "10000", label: "Do 10.000 RSD", value: 10000 },
  { id: "20000", label: "Do 20.000 RSD", value: 20000 },
  { id: "20000plus", label: "20.000+ RSD", value: 25000 },
  { id: "custom", label: "Drugi iznos", value: "custom" },
] as const;

export const TRANSPORT_OPTIONS: {
  id: TransportType;
  label: string;
}[] = [
  { id: "car", label: "Auto" },
  { id: "bus", label: "Autobus" },
  { id: "train", label: "Voz" },
  { id: "walk", label: "Peške" },
  { id: "bike", label: "Bicikl" },
];

export const DISTANCE_OPTIONS = [
  { id: "10", label: "10 km", value: 10 },
  { id: "25", label: "25 km", value: 25 },
  { id: "50", label: "50 km", value: 50 },
  { id: "100", label: "100 km", value: 100 },
  { id: "150", label: "150 km", value: 150 },
  { id: "250", label: "250 km", value: 250 },
  { id: "any", label: "Nije bitno", value: undefined },
] as const;

export const TRAVEL_STYLE_OPTIONS: {
  id: TravelStyle;
  label: string;
  description: string;
}[] = [
  {
    id: "relaxed",
    label: "Opušteno",
    description: "Manje lokacija, više vremena na svakom mestu.",
  },
  {
    id: "balanced",
    label: "Balansirano",
    description: "Dobar ritam između obilaska i odmora.",
  },
  {
    id: "packed",
    label: "Što više mesta",
    description: "Puniji dan i više različitih stanica.",
  },
];

export const START_CITIES: {
  name: string;
  latitude: number;
  longitude: number;
}[] = [
  { name: "Ruma", latitude: 45.0081, longitude: 19.8222 },
  { name: "Beograd", latitude: 44.7866, longitude: 20.4489 },
  { name: "Novi Sad", latitude: 45.2671, longitude: 19.8335 },
  { name: "Niš", latitude: 43.3209, longitude: 21.8958 },
  { name: "Kragujevac", latitude: 44.0128, longitude: 20.9114 },
  { name: "Subotica", latitude: 46.1003, longitude: 19.6656 },
  { name: "Zrenjanin", latitude: 45.3816, longitude: 20.3686 },
  { name: "Pančevo", latitude: 44.8708, longitude: 20.6403 },
  { name: "Čačak", latitude: 43.8914, longitude: 20.3496 },
  { name: "Kraljevo", latitude: 43.7258, longitude: 20.6896 },
  { name: "Smederevo", latitude: 44.6658, longitude: 20.9281 },
  { name: "Užice", latitude: 43.8586, longitude: 19.8488 },
  { name: "Valjevo", latitude: 44.2751, longitude: 19.8982 },
  { name: "Šabac", latitude: 44.7467, longitude: 19.6931 },
  { name: "Sombor", latitude: 45.7742, longitude: 19.1151 },
  { name: "Sremska Mitrovica", latitude: 44.9764, longitude: 19.6122 },
  { name: "Požarevac", latitude: 44.6213, longitude: 21.1878 },
  { name: "Leskovac", latitude: 42.9981, longitude: 21.9461 },
  { name: "Vranje", latitude: 42.5514, longitude: 21.9003 },
  { name: "Pirot", latitude: 43.155, longitude: 22.5858 },
  { name: "Novi Pazar", latitude: 43.1367, longitude: 20.5122 },
  { name: "Zaječar", latitude: 43.9036, longitude: 22.2844 },
  { name: "Kruševac", latitude: 43.5806, longitude: 21.3336 },
];

export const POPULAR_DESTINATIONS = [
  {
    name: "Novi Sad",
    slug: "novi-sad",
    region: "Vojvodina",
    imageUrl: "/images/petrovaradin.jpg",
    description: "Petrovaradin, Dunav i šetnja kroz stari centar.",
  },
  {
    name: "Fruška gora",
    slug: "fruska-gora",
    region: "Srem",
    imageUrl: "/images/jazak.jpg",
    description: "Manastiri, vidikovci i vinogradi nad Sremom.",
  },
  {
    name: "Tara",
    slug: "tara",
    region: "Zapadna Srbija",
    imageUrl: "/images/banjska-stena.jpg",
    description: "Kanjoni, jezero i jedan od najlepših vidikovaca u zemlji.",
  },
  {
    name: "Zlatibor",
    slug: "zlatibor",
    region: "Zapadna Srbija",
    imageUrl: "/images/zlatibor.jpg",
    description: "Prostrani pašnjaci, pećine i lagani izleti.",
  },
  {
    name: "Beograd",
    slug: "beograd",
    region: "Beograd",
    imageUrl: "/images/beograd.jpg",
    description: "Kalemegdan, Ada i ritam glavnog grada.",
  },
  {
    name: "Đerdap",
    slug: "djerdap",
    region: "Istočna Srbija",
    imageUrl: "/images/golubac.jpg",
    description: "Dunavska klisura, Golubac i Lepenski Vir.",
  },
  {
    name: "Kopaonik",
    slug: "kopaonik",
    region: "Južna Srbija",
    imageUrl: "/images/kopaonik.jpg",
    description: "Planinski vrhovi, šetnje i vazduh koji bistri glavu.",
  },
  {
    name: "Subotica",
    slug: "subotica",
    region: "Severna Bačka",
    imageUrl: "/images/subotica.jpg",
    description: "Secesija, Palićko jezero i slatki ritam severa.",
  },
] as const;

export const GENERATION_MESSAGES = [
  "Tražimo najbolja mesta...",
  "Proveravamo udaljenosti...",
  "Sastavljamo rutu...",
  "Pravimo tvoj plan...",
];
