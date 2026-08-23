import type { Coordinates } from "@/types/place";

export interface MapPoint {
  id: string;
  name: string;
  coordinates: Coordinates;
  description?: string;
  kind?: "start" | "stop" | "lodging";
}
