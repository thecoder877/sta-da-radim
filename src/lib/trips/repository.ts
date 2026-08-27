import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapDatabaseTripToGeneratedTrip,
  mapGeneratedTripToDatabaseInput,
  mapStopToDatabaseInput,
  mapTripRowToSummary,
  type TripDayRow,
  type TripRow,
  type TripStopRow,
} from "@/lib/trips/mappers";
import { createShareSlug } from "@/lib/trips/sharing";
import type { GeneratedTrip, SavedTripSummary } from "@/types/trip";

async function loadTripGraph(
  supabase: SupabaseClient,
  trip: TripRow,
  currentUserId?: string | null,
): Promise<GeneratedTrip> {
  const { data: days, error: daysError } = await supabase
    .from("trip_days")
    .select("*")
    .eq("trip_id", trip.id)
    .order("day_number", { ascending: true });

  if (daysError) {
    throw new Error("TRIP_LOAD_FAILED");
  }

  const dayRows = (days ?? []) as TripDayRow[];
  const dayIds = dayRows.map((day) => day.id);
  let stopRows: TripStopRow[] = [];

  if (dayIds.length > 0) {
    const { data: stops, error: stopsError } = await supabase
      .from("trip_stops")
      .select("*")
      .in("trip_day_id", dayIds)
      .order("position", { ascending: true });
    if (stopsError) {
      throw new Error("TRIP_LOAD_FAILED");
    }
    stopRows = (stops ?? []) as TripStopRow[];
  }

  return mapDatabaseTripToGeneratedTrip(trip, dayRows, stopRows, { currentUserId });
}

export async function saveGeneratedTrip(
  supabase: SupabaseClient,
  userId: string,
  trip: GeneratedTrip,
): Promise<GeneratedTrip> {
  const input = mapGeneratedTripToDatabaseInput(trip);
  const { data: inserted, error } = await supabase
    .from("trips")
    .insert({ ...input, user_id: userId })
    .select("*")
    .single();

  if (error || !inserted) {
    throw new Error("TRIP_SAVE_FAILED");
  }

  const tripId = (inserted as TripRow).id;

  try {
    for (const day of trip.daysPlan) {
      const { data: dayRow, error: dayError } = await supabase
        .from("trip_days")
        .insert({
          trip_id: tripId,
          day_number: day.dayNumber,
          date: day.date,
        })
        .select("*")
        .single();

      if (dayError || !dayRow) {
        throw new Error("TRIP_SAVE_FAILED");
      }

      if (day.stops.length === 0) {
        continue;
      }

      const { error: stopsError } = await supabase.from("trip_stops").insert(
        day.stops.map((stop, index) => ({
          trip_day_id: (dayRow as TripDayRow).id,
          ...mapStopToDatabaseInput(stop, index),
        })),
      );

      if (stopsError) {
        throw new Error("TRIP_SAVE_FAILED");
      }
    }
  } catch (saveError) {
    await supabase.from("trips").delete().eq("id", tripId);
    throw saveError;
  }

  return loadTripGraph(supabase, inserted as TripRow, userId);
}

export async function listSavedTrips(
  supabase: SupabaseClient,
  userId: string,
): Promise<SavedTripSummary[]> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("TRIP_LIST_FAILED");
  }

  return ((data ?? []) as TripRow[]).map(mapTripRowToSummary);
}

export async function getSavedTripById(
  supabase: SupabaseClient,
  id: string,
  currentUserId?: string | null,
): Promise<GeneratedTrip | null> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error("TRIP_LOAD_FAILED");
  }
  if (!data) {
    return null;
  }
  return loadTripGraph(supabase, data as TripRow, currentUserId);
}

export async function getPublicTripByShareSlug(
  supabase: SupabaseClient,
  shareSlug: string,
): Promise<GeneratedTrip | null> {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("share_slug", shareSlug)
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    throw new Error("TRIP_LOAD_FAILED");
  }
  if (!data) {
    return null;
  }
  return loadTripGraph(supabase, data as TripRow, null);
}

export async function setTripSharing(
  supabase: SupabaseClient,
  userId: string,
  tripId: string,
  makePublic: boolean,
): Promise<GeneratedTrip | null> {
  const existing = await getSavedTripById(supabase, tripId, userId);
  if (!existing?.isOwner) {
    return null;
  }

  const shareSlug = makePublic
    ? (existing.shareSlug ?? createShareSlug(existing.title))
    : existing.shareSlug;
  const { data, error } = await supabase
    .from("trips")
    .update({
      is_public: makePublic,
      share_slug: shareSlug ?? null,
    })
    .eq("id", tripId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error("TRIP_UPDATE_FAILED");
  }
  if (!data) {
    return null;
  }
  return loadTripGraph(supabase, data as TripRow, userId);
}

export async function deleteSavedTrip(
  supabase: SupabaseClient,
  userId: string,
  tripId: string,
): Promise<boolean> {
  const { error, count } = await supabase
    .from("trips")
    .delete({ count: "exact" })
    .eq("id", tripId)
    .eq("user_id", userId);

  if (error) {
    throw new Error("TRIP_DELETE_FAILED");
  }
  return (count ?? 0) > 0;
}
