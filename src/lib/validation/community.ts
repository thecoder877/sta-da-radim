import { z } from "zod";
import { USERNAME_PATTERN } from "@/lib/community/constants";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_PATTERN, "Korisničko ime: 3–30 karaktera, slova, brojevi i donja crta.");

export const profileUpdateSchema = z
  .object({
    username: usernameSchema.optional(),
    displayName: z.string().trim().max(80).optional(),
    bio: z.string().trim().max(400).optional(),
  })
  .strict();

export const reviewInputSchema = z.object({
  placeKey: z.string().min(2),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().min(10, "Recenzija mora imati bar 10 karaktera.").max(5000),
  visitDate: z.string().optional(),
  parkingRating: z.enum(["easy", "average", "difficult", "unknown"]).optional(),
  crowdLevel: z.enum(["low", "medium", "high"]).optional(),
  worthVisiting: z.boolean().optional(),
  recommendedFor: z
    .array(z.enum(["couples", "families", "children", "solo", "friends", "photography", "hiking"]))
    .default([]),
});

export const replyInputSchema = z.object({
  reviewId: z.string().uuid(),
  content: z.string().trim().min(2).max(1000),
});

export const voteInputSchema = z.object({
  reviewId: z.string().uuid(),
  vote: z.union([z.literal(1), z.literal(-1), z.null()]),
});

export const placeSubmissionSchema = z.object({
  name: z.string().trim().min(2).max(160),
  shortDescription: z.string().trim().min(10).max(280),
  description: z.string().trim().max(4000).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  region: z.string().trim().max(80).optional(),
  category: z.string().trim().min(2).max(60),
  openingHours: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  website: z.union([z.string().trim().url().max(240), z.literal("")]).optional(),
  instagram: z.string().trim().max(120).optional(),
  facebook: z.string().trim().max(240).optional(),
  priceInfo: z.string().trim().max(200).optional(),
  parkingInfo: z.string().trim().max(200).optional(),
  estimatedDurationMinutes: z.number().int().positive().max(24 * 60).optional(),
  indoor: z.boolean().optional(),
  outdoor: z.boolean().optional(),
  familyFriendly: z.boolean().optional(),
  petFriendly: z.boolean().optional(),
  accessibilityNotes: z.string().trim().max(400).optional(),
  tags: z.array(z.string()).default([]),
  sourceNote: z.string().trim().max(400).optional(),
});

export const placeEditSchema = z.object({
  placeKey: z.string().min(2).max(160),
  sourceNote: z.string().trim().max(400).optional(),
  fields: z
    .array(
      z.object({
        fieldName: z.enum([
          "opening_hours",
          "phone",
          "website",
          "instagram",
          "facebook",
          "address",
          "price_info",
          "parking_info",
          "estimated_duration_minutes",
          "description",
          "short_description",
          "category",
          "family_friendly",
          "pet_friendly",
          "accessibility_notes",
          "latitude",
          "longitude",
        ]),
        newValue: z.unknown(),
      }),
    )
    .min(1)
    .max(20),
});

export const reportInputSchema = z.object({
  targetType: z.enum(["review", "reply", "photo", "place"]),
  targetId: z.string().min(1),
  reason: z.enum([
    "spam",
    "offensive",
    "incorrect_information",
    "irrelevant",
    "fake_review",
    "copyright",
    "other",
  ]),
  details: z.string().trim().max(800).optional(),
});

export const adminDecisionSchema = z.object({
  action: z.enum(["approve", "reject", "edit_approve", "remove", "restore", "resolve", "dismiss"]),
  note: z.string().trim().max(500).optional(),
  publicNote: z.string().trim().max(400).optional(),
  patch: z.record(z.string(), z.unknown()).optional(),
});
