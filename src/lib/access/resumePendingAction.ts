import {
  clearPendingProtectedAction,
  readPendingProtectedAction,
} from "@/lib/access/pendingAction";
import { isQuotaError, requestGeneratedTrip } from "@/lib/trips/generateClient";
import { saveTripToAccount } from "@/lib/trips/clientApi";
import { persistGeneratedTrip, persistLastTripRequest } from "@/lib/trips/storage";

export async function resumePendingProtectedAction(
  navigate: (href: string) => void,
): Promise<boolean> {
  const pending = readPendingProtectedAction();
  clearPendingProtectedAction();
  if (!pending) {
    return false;
  }

  try {
    if (pending.type === "generate") {
      persistLastTripRequest(pending.request);
      try {
        const trip = await requestGeneratedTrip(pending.request);
        persistGeneratedTrip(trip);
        navigate(`/trip/${trip.id}`);
        return true;
      } catch (error) {
        if (isQuotaError(error)) {
          navigate("/upgrade");
          return true;
        }
        throw error;
      }
    }

    if (pending.type === "community") {
      navigate(pending.href);
      return true;
    }

    const saved = await saveTripToAccount(pending.trip);
    persistGeneratedTrip(saved);
    navigate(`/trip/${saved.id}`);
    return true;
  } catch {
    return false;
  }
}
