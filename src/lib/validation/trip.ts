import { z } from "zod";

export const tripRequestSchema = z.object({
  startLocation: z.object({
    name: z.string().trim().min(2, "Unesi mesto sa kog krećeš."),
    coordinates: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .optional(),
  }),
  startDate: z.string().min(1, "Izaberi datum polaska."),
  days: z.number().int().min(1).max(14),
  durationPreset: z.enum(["hours", "1", "2", "3", "4plus"]).optional(),
  numberOfPeople: z
    .number()
    .int()
    .min(1, "Mora biti bar jedna osoba.")
    .max(20, "Za veće grupe planiraj ručno."),
  budget: z.number().positive().optional(),
  transport: z.enum(["car", "bus", "train", "walk", "bike"]),
  maxDistanceKm: z.number().positive().max(800).optional(),
  interests: z.array(z.string()).min(1, "Izaberi bar jedno interesovanje."),
  travelStyle: z.enum(["relaxed", "balanced", "packed"]),
  additionalPreferences: z.string().max(600).optional(),
});

export type TripRequestInput = z.infer<typeof tripRequestSchema>;
