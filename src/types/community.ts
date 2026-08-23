import type { UserProfile } from "@/types/user";

export type ContentStatus = "published" | "removed" | "hidden";
export type ModerationStatus = "pending" | "approved" | "rejected";
export type ParkingRating = "easy" | "average" | "difficult" | "unknown";
export type CrowdLevel = "low" | "medium" | "high";
export type RecommendedFor =
  | "couples"
  | "families"
  | "children"
  | "solo"
  | "friends"
  | "photography"
  | "hiking";

export interface PublicAuthor {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface ReviewPhoto {
  id: string;
  storagePath: string;
  publicUrl: string;
  caption?: string;
}

export interface ReviewReply {
  id: string;
  reviewId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: PublicAuthor;
  isOwner: boolean;
}

export interface PlaceReview {
  id: string;
  placeId: string;
  placeKey: string;
  rating: number;
  title?: string;
  content: string;
  visitDate?: string;
  parkingRating?: ParkingRating;
  crowdLevel?: CrowdLevel;
  worthVisiting?: boolean;
  recommendedFor: RecommendedFor[];
  createdAt: string;
  updatedAt: string;
  author: PublicAuthor;
  photos: ReviewPhoto[];
  replies: ReviewReply[];
  helpfulCount: number;
  notHelpfulCount: number;
  viewerVote: 1 | -1 | null;
  isOwner: boolean;
  status?: string;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  worthVisitingPercent?: number;
  parkingSummary?: string;
  crowdSummary?: string;
  recommendedFor?: { id: string; label: string; count: number }[];
}

export interface PlaceSubmissionInput {
  name: string;
  shortDescription: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  region?: string;
  category: string;
  openingHours?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  priceInfo?: string;
  parkingInfo?: string;
  estimatedDurationMinutes?: number;
  indoor?: boolean;
  outdoor?: boolean;
  familyFriendly?: boolean;
  petFriendly?: boolean;
  accessibilityNotes?: string;
  tags?: string[];
  sourceNote?: string;
}

export interface PlaceSubmissionRecord extends PlaceSubmissionInput {
  id: string;
  status: ModerationStatus;
  publicModeratorNote?: string;
  createdAt: string;
  reviewedAt?: string;
  photoUrls: string[];
}

export interface PlaceEditField {
  fieldName: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface PlaceEditRequest {
  id: string;
  placeKey: string;
  status: ModerationStatus;
  sourceNote?: string;
  publicModeratorNote?: string;
  createdAt: string;
  fields: PlaceEditField[];
}

export interface ReportInput {
  targetType: "review" | "reply" | "photo" | "place";
  targetId: string;
  reason: string;
  details?: string;
}

export interface AdminCounts {
  pendingPlaces: number;
  pendingEdits: number;
  openReports: number;
  publishedReviews: number;
  reportedPhotos: number;
}

export type { UserProfile };
