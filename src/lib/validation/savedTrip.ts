import { z } from "zod";

const coordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const placeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  slug: z.string(),
  shortDescription: z.string(),
  description: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().optional(),
  region: z.string().optional(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  website: z.string().optional(),
  imageUrl: z.string().optional(),
  source: z.enum(["internal", "community", "google", "osm"]),
  verified: z.boolean().default(false),
});

const stopSchema = z.object({
  id: z.string(),
  placeId: z.string(),
  place: placeSchema,
  arrivalTime: z.string(),
  departureTime: z.string().optional(),
  durationMinutes: z.number(),
  reason: z.string().optional(),
  estimatedCost: z.number().optional(),
  kind: z.enum(["visit", "lodging", "start"]).optional(),
});

export const generatedTripSaveSchema = z.object({
  id: z.string(),
  title: z.string().min(2).max(160),
  description: z.string().optional(),
  startLocation: z.string().min(1),
  startDate: z.string().min(4),
  days: z.number().int().min(1).max(14),
  transport: z.enum(["car", "bus", "train", "walk", "bike"]),
  totalDistanceKm: z.number().optional(),
  totalTravelMinutes: z.number().optional(),
  estimatedTotalCost: z.number().optional(),
  stops: z.array(stopSchema),
  daysPlan: z.array(
    z.object({
      dayNumber: z.number().int().min(1),
      date: z.string(),
      stops: z.array(stopSchema),
    }),
  ),
  startCoordinates: coordinatesSchema.optional(),
  routeCoordinates: z.array(coordinatesSchema).optional(),
  createdAt: z.string(),
  shareSlug: z.string().optional(),
  isPublic: z.boolean().optional(),
  request: z
    .object({
      startLocation: z.object({
        name: z.string(),
        coordinates: coordinatesSchema.optional(),
      }),
      startDate: z.string(),
      days: z.number(),
      durationPreset: z.enum(["hours", "1", "2", "3", "4plus"]).optional(),
      numberOfPeople: z.number(),
      budget: z.number().optional(),
      transport: z.enum(["car", "bus", "train", "walk", "bike"]),
      maxDistanceKm: z.number().optional(),
      interests: z.array(z.string()),
      travelStyle: z.enum(["relaxed", "balanced", "packed"]),
      additionalPreferences: z.string().optional(),
    })
    .optional(),
});
