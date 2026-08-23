import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdminUser } from "@/lib/auth/profile";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/Container";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const supabase = await createServerSupabaseClient();
  if (!user || !supabase || !(await isAdminUser(supabase, user.id))) {
    notFound();
  }

  const links = [
    ["/admin", "Pregled"],
    ["/admin/place-submissions", "Nove lokacije"],
    ["/admin/place-edits", "Izmene"],
    ["/admin/reviews", "Recenzije"],
    ["/admin/reports", "Prijave"],
    ["/admin/photos", "Fotografije"],
    ["/admin/users", "Korisnici"],
  ] as const;

  return (
    <div className="border-t border-border/60 bg-muted/20">
      <Container className="py-6">
        <p className="text-sm text-primary">Moderacija</p>
        <nav className="mt-3 flex flex-wrap gap-3 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="underline-offset-4 hover:underline">
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-6">{children}</div>
      </Container>
    </div>
  );
}
