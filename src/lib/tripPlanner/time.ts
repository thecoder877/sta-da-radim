/**
 * Add minutes to a "HH:MM" clock string, wrapping around midnight.
 * Shared by itinerary scheduling (mockGenerateTrip) and lodging enrichment.
 */
export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number);
  const total = hours * 60 + mins + minutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nextHours = Math.floor(wrapped / 60);
  const nextMins = wrapped % 60;
  return `${String(nextHours).padStart(2, "0")}:${String(nextMins).padStart(2, "0")}`;
}
