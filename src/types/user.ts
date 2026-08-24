export type UserRole = "user" | "admin" | "moderator";

export type AccountPlan = "free" | "plus";

export interface UserProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
  role?: UserRole;
  plan?: AccountPlan;
  createdAt: string;
  updatedAt: string;
}

export type PlaceSubmissionStatus = "pending" | "approved" | "rejected";

export interface PlaceSubmission {
  id: string;
  userId: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  status: PlaceSubmissionStatus;
  moderatorNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface PlaceReview {
  id: string;
  userId: string;
  placeId: string;
  rating: number;
  title?: string;
  content: string;
  visitDate?: string;
  createdAt: string;
  updatedAt: string;
}
