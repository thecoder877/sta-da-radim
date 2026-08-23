import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { getProfileByUsername } from "@/lib/auth/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    notFound();
  }
  const profile = await getProfileByUsername(supabase, username);
  if (!profile) {
    notFound();
  }

  const { count: reviewCount } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("status", "published");
  const { data: ownReviews } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", profile.id)
    .eq("status", "published");
  const reviewIds = (ownReviews ?? []).map((row) => row.id as string);
  const { count: helpful } = reviewIds.length
    ? await supabase.from("review_votes").select("id", { count: "exact", head: true }).eq("vote", 1).in("review_id", reviewIds)
    : { count: 0 };

  return (
    <Container className="max-w-2xl py-12">
      {profile.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatarUrl} alt="" className="mb-4 size-20 rounded-full object-cover" />
      ) : null}
      <h1 className="font-heading text-4xl">{profile.displayName || profile.username}</h1>
      <p className="mt-2 text-muted-foreground">@{profile.username}</p>
      {profile.bio ? <p className="mt-4 text-sm leading-6">{profile.bio}</p> : null}
      <dl className="mt-8 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
          <dt className="text-muted-foreground">Recenzije</dt>
          <dd className="mt-1 font-medium">{reviewCount ?? 0}</dd>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
          <dt className="text-muted-foreground">Korisni glasovi</dt>
          <dd className="mt-1 font-medium">{helpful ?? 0}</dd>
        </div>
      </dl>
    </Container>
  );
}
