import type { SupabaseClient } from "@supabase/supabase-js";
import { CROWD_OPTIONS, PARKING_OPTIONS, RECOMMENDED_FOR_OPTIONS } from "@/lib/community/constants";
import { CommunityError } from "@/lib/community/errors";
import { authorFromProfile } from "@/lib/community/identity";
import { ensureCanonicalPlace } from "@/lib/places/canonical";
import type { Place } from "@/types/place";
import type {
  PlaceReview,
  PublicAuthor,
  ReviewPhoto,
  ReviewReply,
  ReviewSummary,
} from "@/types/community";

function publicUrl(supabase: SupabaseClient, bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function emptyAuthor(userId: string): PublicAuthor {
  return { id: userId, username: null, displayName: null, avatarUrl: null };
}

async function loadAuthors(supabase: SupabaseClient, userIds: string[]): Promise<Map<string, PublicAuthor>> {
  const unique = [...new Set(userIds)];
  const map = new Map<string, PublicAuthor>();
  if (unique.length === 0) {
    return map;
  }
  const { data } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", unique);
  for (const row of data ?? []) {
    map.set(row.id as string, authorFromProfile(row as never));
  }
  return map;
}

export async function listReviewsForPlace(
  supabase: SupabaseClient,
  placeKey: string,
  viewerId?: string | null,
  sort: "helpful" | "newest" | "highest" | "lowest" = "helpful",
): Promise<{ reviews: PlaceReview[]; summary: ReviewSummary }> {
  const { data: place } = await supabase.from("places").select("id").eq("place_key", placeKey).maybeSingle();
  if (!place) {
    return { reviews: [], summary: emptySummary() };
  }

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("*")
    .eq("place_id", place.id)
    .eq("status", "published");

  const reviewsRaw = reviewRows ?? [];
  const reviewIds = reviewsRaw.map((row) => row.id as string);
  const userIds = reviewsRaw.map((row) => row.user_id as string);

  const [{ data: photos }, { data: votes }, { data: replies }] = await Promise.all([
    reviewIds.length
      ? supabase.from("review_photos").select("*").in("review_id", reviewIds).eq("status", "visible")
      : Promise.resolve({ data: [] }),
    reviewIds.length
      ? supabase.from("review_votes").select("*").in("review_id", reviewIds)
      : Promise.resolve({ data: [] }),
    reviewIds.length
      ? supabase.from("review_replies").select("*").in("review_id", reviewIds).eq("status", "published")
      : Promise.resolve({ data: [] }),
  ]);

  const replyUserIds = (replies ?? []).map((row) => row.user_id as string);
  const authors = await loadAuthors(supabase, [...userIds, ...replyUserIds]);

  const photosByReview = new Map<string, ReviewPhoto[]>();
  for (const photo of photos ?? []) {
    const list = photosByReview.get(photo.review_id as string) ?? [];
    list.push({
      id: photo.id as string,
      storagePath: photo.storage_path as string,
      publicUrl: publicUrl(supabase, "review-photos", photo.storage_path as string),
      caption: (photo.caption as string | null) ?? undefined,
    });
    photosByReview.set(photo.review_id as string, list);
  }

  const votesByReview = new Map<string, { helpful: number; notHelpful: number; mine: 1 | -1 | null }>();
  for (const vote of votes ?? []) {
    const current = votesByReview.get(vote.review_id as string) ?? { helpful: 0, notHelpful: 0, mine: null };
    if (vote.vote === 1) {
      current.helpful += 1;
    } else {
      current.notHelpful += 1;
    }
    if (viewerId && vote.user_id === viewerId) {
      current.mine = vote.vote as 1 | -1;
    }
    votesByReview.set(vote.review_id as string, current);
  }

  const repliesByReview = new Map<string, ReviewReply[]>();
  for (const reply of replies ?? []) {
    const list = repliesByReview.get(reply.review_id as string) ?? [];
    list.push({
      id: reply.id as string,
      reviewId: reply.review_id as string,
      content: reply.content as string,
      createdAt: reply.created_at as string,
      updatedAt: reply.updated_at as string,
      author: authors.get(reply.user_id as string) ?? emptyAuthor(reply.user_id as string),
      isOwner: viewerId === reply.user_id,
    });
    repliesByReview.set(reply.review_id as string, list);
  }

  let reviews: PlaceReview[] = reviewsRaw.map((row) => {
    const vote = votesByReview.get(row.id as string) ?? { helpful: 0, notHelpful: 0, mine: null };
    return {
      id: row.id as string,
      placeId: row.place_id as string,
      placeKey: row.place_key as string,
      rating: row.rating as number,
      title: (row.title as string | null) ?? undefined,
      content: row.content as string,
      visitDate: (row.visit_date as string | null) ?? undefined,
      parkingRating: (row.parking_rating as PlaceReview["parkingRating"]) ?? undefined,
      crowdLevel: (row.crowd_level as PlaceReview["crowdLevel"]) ?? undefined,
      worthVisiting: (row.worth_visiting as boolean | null) ?? undefined,
      recommendedFor: (row.recommended_for as PlaceReview["recommendedFor"]) ?? [],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      author: authors.get(row.user_id as string) ?? emptyAuthor(row.user_id as string),
      photos: photosByReview.get(row.id as string) ?? [],
      replies: (repliesByReview.get(row.id as string) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      helpfulCount: vote.helpful,
      notHelpfulCount: vote.notHelpful,
      viewerVote: vote.mine,
      isOwner: viewerId === row.user_id,
    };
  });

  reviews = sortReviews(reviews, sort);
  return { reviews, summary: summarizeReviews(reviews) };
}

function sortReviews(reviews: PlaceReview[], sort: "helpful" | "newest" | "highest" | "lowest"): PlaceReview[] {
  const copy = [...reviews];
  if (sort === "newest") {
    return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  if (sort === "highest") {
    return copy.sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt));
  }
  if (sort === "lowest") {
    return copy.sort((a, b) => a.rating - b.rating || b.createdAt.localeCompare(a.createdAt));
  }
  return copy.sort((a, b) => b.helpfulCount - a.helpfulCount || b.createdAt.localeCompare(a.createdAt));
}

function emptySummary(): ReviewSummary {
  return {
    average: 0,
    count: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
}

function summarizeReviews(reviews: PlaceReview[]): ReviewSummary {
  const summary = emptySummary();
  summary.count = reviews.length;
  if (reviews.length === 0) {
    return summary;
  }
  let total = 0;
  for (const review of reviews) {
    total += review.rating;
    summary.distribution[review.rating as 1 | 2 | 3 | 4 | 5] += 1;
  }
  summary.average = Math.round((total / reviews.length) * 10) / 10;

  if (reviews.length >= 3) {
    const worth = reviews.filter((review) => review.worthVisiting !== undefined);
    if (worth.length >= 3) {
      summary.worthVisitingPercent = Math.round(
        (worth.filter((review) => review.worthVisiting).length / worth.length) * 100,
      );
    }
    const parking = reviews.filter((review) => review.parkingRating && review.parkingRating !== "unknown");
    if (parking.length >= 3) {
      const winner = mode(parking.map((review) => review.parkingRating as string));
      summary.parkingSummary = PARKING_OPTIONS.find((item) => item.id === winner)?.label;
    }
    const crowd = reviews.filter((review) => review.crowdLevel);
    if (crowd.length >= 3) {
      const winner = mode(crowd.map((review) => review.crowdLevel as string));
      summary.crowdSummary = CROWD_OPTIONS.find((item) => item.id === winner)?.label;
    }
    const recCounts = new Map<string, number>();
    for (const review of reviews) {
      for (const tag of review.recommendedFor) {
        recCounts.set(tag, (recCounts.get(tag) ?? 0) + 1);
      }
    }
    summary.recommendedFor = [...recCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => ({
        id,
        label: RECOMMENDED_FOR_OPTIONS.find((item) => item.id === id)?.label ?? id,
        count,
      }));
  }
  return summary;
}

function mode(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export async function upsertReview(
  supabase: SupabaseClient,
  userId: string,
  place: Place,
  input: {
    rating: number;
    title?: string;
    content: string;
    visitDate?: string;
    parkingRating?: string;
    crowdLevel?: string;
    worthVisiting?: boolean;
    recommendedFor: string[];
  },
): Promise<void> {
  const canonical = await ensureCanonicalPlace(supabase, place, userId);
  const payload = {
    place_id: canonical.id,
    place_key: place.id,
    user_id: userId,
    rating: input.rating,
    title: input.title || null,
    content: input.content,
    visit_date: input.visitDate || null,
    parking_rating: input.parkingRating || null,
    crowd_level: input.crowdLevel || null,
    worth_visiting: input.worthVisiting ?? null,
    recommended_for: input.recommendedFor,
    status: "published",
    removed_at: null,
    removed_by: null,
    removal_reason: null,
  };

  const { error } = await supabase.from("reviews").upsert(payload, { onConflict: "user_id,place_id" });
  if (error) {
    throw new CommunityError("Recenzija nije sačuvana.", "INVALID_REQUEST", 400);
  }
}

export async function softDeleteOwnReview(
  supabase: SupabaseClient,
  userId: string,
  reviewId: string,
): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .update({
      status: "removed",
      removed_at: new Date().toISOString(),
      removed_by: userId,
      removal_reason: "owner_deleted",
    })
    .eq("id", reviewId)
    .eq("user_id", userId);
  if (error) {
    throw new CommunityError("Recenzija nije obrisana.", "INVALID_REQUEST");
  }
}

export async function setReviewVote(
  supabase: SupabaseClient,
  userId: string,
  reviewId: string,
  vote: 1 | -1 | null,
): Promise<void> {
  if (vote === null) {
    await supabase.from("review_votes").delete().eq("review_id", reviewId).eq("user_id", userId);
    return;
  }
  const { error } = await supabase.from("review_votes").upsert({
    review_id: reviewId,
    user_id: userId,
    vote,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    throw new CommunityError("Glas nije sačuvan.", "INVALID_REQUEST");
  }
}

export async function addReply(
  supabase: SupabaseClient,
  userId: string,
  reviewId: string,
  content: string,
): Promise<void> {
  const { error } = await supabase.from("review_replies").insert({
    review_id: reviewId,
    user_id: userId,
    content,
  });
  if (error) {
    throw new CommunityError("Odgovor nije sačuvan.", "INVALID_REQUEST");
  }
}

export async function addReviewPhoto(
  supabase: SupabaseClient,
  userId: string,
  reviewId: string,
  storagePath: string,
  caption?: string,
): Promise<void> {
  const { count } = await supabase
    .from("review_photos")
    .select("id", { count: "exact", head: true })
    .eq("review_id", reviewId)
    .eq("status", "visible");
  if ((count ?? 0) >= 5) {
    throw new CommunityError("Možeš dodati najviše 5 fotografija.", "PHOTO_LIMIT");
  }
  const { error } = await supabase.from("review_photos").insert({
    review_id: reviewId,
    user_id: userId,
    storage_path: storagePath,
    caption: caption || null,
  });
  if (error) {
    throw new CommunityError("Fotografija nije sačuvana.", "INVALID_REQUEST");
  }
}

export async function listOwnReviews(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlaceReview[]> {
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    placeId: row.place_id as string,
    placeKey: row.place_key as string,
    rating: row.rating as number,
    title: (row.title as string | null) ?? undefined,
    content: row.content as string,
    visitDate: (row.visit_date as string | null) ?? undefined,
    parkingRating: (row.parking_rating as PlaceReview["parkingRating"]) ?? undefined,
    crowdLevel: (row.crowd_level as PlaceReview["crowdLevel"]) ?? undefined,
    worthVisiting: (row.worth_visiting as boolean | null) ?? undefined,
    recommendedFor: (row.recommended_for as PlaceReview["recommendedFor"]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    author: emptyAuthor(userId),
    photos: [],
    replies: [],
    helpfulCount: 0,
    notHelpfulCount: 0,
    viewerVote: null,
    isOwner: true,
    status: row.status as string,
  })) as PlaceReview[];
}

export async function softDeleteOwnReply(
  supabase: SupabaseClient,
  userId: string,
  replyId: string,
): Promise<void> {
  const { error } = await supabase
    .from("review_replies")
    .update({
      status: "removed",
      removed_at: new Date().toISOString(),
      removed_by: userId,
      removal_reason: "owner_deleted",
    })
    .eq("id", replyId)
    .eq("user_id", userId);
  if (error) {
    throw new CommunityError("Odgovor nije obrisan.", "INVALID_REQUEST");
  }
}

export async function getOwnReviewId(
  supabase: SupabaseClient,
  userId: string,
  placeKey: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", userId)
    .eq("place_key", placeKey)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}
