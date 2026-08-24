"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { profileLabel } from "@/lib/community/identity";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/explore", label: "Istraži" },
  { href: "/plan", label: "Planiraj" },
  { href: "/saved", label: "Sačuvano" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, profile, quota, signOut } = useAuth();
  const label = profileLabel(profile);
  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
            Š
          </span>
          <span className="font-heading text-[1.05rem] tracking-tight">{APP_NAME}</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Glavna navigacija">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted hover:text-foreground",
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user ? (
            <Popover>
              <PopoverTrigger render={<Button variant="ghost" className="max-w-48 px-2" />}>
                {profile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt="" className="size-6 rounded-full object-cover" />
                ) : (
                  <span className="flex size-6 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                    {label.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="max-w-28 truncate">{label}</span>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-medium">{label}</p>
                  {profile?.username ? (
                    <p className="truncate text-xs text-muted-foreground">@{profile.username}</p>
                  ) : null}
                </div>
                {profile?.username ? (
                  <Button variant="ghost" size="sm" className="w-full justify-start" render={<Link href={`/user/${profile.username}`} />}>
                    Moj profil
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" className="w-full justify-start" render={<Link href="/saved" />}>
                  Moja putovanja
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" render={<Link href="/contributions" />}>
                  Moji doprinosi
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" render={<Link href="/add-place" />}>
                  Dodaj mesto
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" render={<Link href="/settings" />}>
                  Podešavanja
                </Button>
                {quota && !quota.unlimited ? (
                  <Button variant="ghost" size="sm" className="w-full justify-start" render={<Link href="/upgrade" />}>
                    Nadogradi · {quota.generationsRemaining}/{quota.generationsLimit}
                  </Button>
                ) : null}
                {isAdmin ? (
                  <Button variant="ghost" size="sm" className="w-full justify-start" render={<Link href="/admin" />}>
                    Moderacija
                  </Button>
                ) : null}
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => void signOut()}>
                  Odjavi se
                </Button>
              </PopoverContent>
            </Popover>
          ) : (
            <Button variant="ghost" render={<Link href="/login" />}>
              Prijavi se
            </Button>
          )}
          <Button render={<Link href="/plan" />}>Planiraj</Button>
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="icon" className="ml-auto md:hidden" aria-label="Otvori meni" />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <SheetHeader>
              <SheetTitle>{APP_NAME}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4" aria-label="Mobilna navigacija">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                  {link.label}
                </Link>
              ))}
              <Link href="/add-place" className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                Dodaj mesto
              </Link>
              {user ? (
                <>
                  <p className="px-3 pt-3 text-sm font-medium">{label}</p>
                  {profile?.username ? (
                    <Link href={`/user/${profile.username}`} className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                      Moj profil
                    </Link>
                  ) : null}
                  <Link href="/saved" className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                    Moja putovanja
                  </Link>
                  <Link href="/contributions" className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                    Moji doprinosi
                  </Link>
                  <Link href="/settings" className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                    Podešavanja
                  </Link>
                  {quota && !quota.unlimited ? (
                    <Link href="/upgrade" className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                      Nadogradi nalog
                    </Link>
                  ) : null}
                  {isAdmin ? (
                    <Link href="/admin" className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                      Moderacija
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    className="rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted"
                    onClick={() => void signOut()}
                  >
                    Odjavi se
                  </button>
                </>
              ) : (
                <Link href="/login" className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                  Prijavi se
                </Link>
              )}
              <Button className="mt-3" render={<Link href="/plan" />}>
                Planiraj
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
