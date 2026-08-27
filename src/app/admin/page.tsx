import { getAdminCounts } from "@/lib/admin/moderation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminHomePage() {
  const supabase = await createServerSupabaseClient();
  const counts = supabase
    ? await getAdminCounts(supabase)
    : {
        pendingPlaces: 0,
        pendingEdits: 0,
        openReports: 0,
        publishedReviews: 0,
        reportedPhotos: 0,
      };

  const cards = [
    [`${counts.pendingPlaces} novih lokacija`, "/admin/place-submissions"],
    ["Objavljene lokacije", "/admin/places"],
    [`${counts.pendingEdits} predloga izmena`, "/admin/place-edits"],
    [`${counts.openReports} otvorenih prijava`, "/admin/reports"],
    [`${counts.reportedPhotos} prijavljenih fotografija`, "/admin/photos"],
    [`${counts.publishedReviews} recenzija`, "/admin/reviews"],
  ] as const;

  return (
    <div>
      <h1 className="font-heading text-3xl">Pregled</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8"
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
