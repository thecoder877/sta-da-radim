import {
  clearPendingProtectedAction,
  readPendingProtectedAction,
} from "@/lib/access/pendingAction";
import { requestGeneratedTrip } from "@/lib/trips/generateClient";
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
      const trip = await requestGeneratedTrip(pending.request);
      persistGeneratedTrip(trip);
      navigate(`/trip/${trip.id}`);
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
