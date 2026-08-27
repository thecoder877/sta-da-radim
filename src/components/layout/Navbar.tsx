"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { NavSearch } from "@/components/layout/NavSearch";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            Š
          </span>
          <span className="font-heading text-lg tracking-tight">{APP_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Glavna navigacija">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm transition-colors hover:text-foreground",
                pathname === link.href
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <NavSearch className="hidden w-44 lg:block" />
          <ThemeToggle />
          {user ? (
            <Popover>
              <PopoverTrigger render={<Button variant="ghost" />}>
                <span className="max-w-36 truncate">{user.email}</span>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56">
                <p className="truncate px-2 text-sm text-muted-foreground">
                  {user.email}
                </p>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  render={<Link href="/saved" />}
                >
                  Sačuvano
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => void signOut()}
                >
                  Odjavi se
                </Button>
              </PopoverContent>
            </Popover>
          ) : (
            <Button variant="ghost" render={<Link href="/login" />}>
              Prijavi se
            </Button>
          )}
          <Button render={<Link href="/plan" />}>Planiraj putovanje</Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="icon" aria-label="Otvori meni" />}
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>{APP_NAME}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="Mobilna navigacija">
                <NavSearch className="mb-2" />
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <p className="px-3 pt-3 text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    <button
                      type="button"
                      className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => void signOut()}
                    >
                      Odjavi se
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  >
                    Prijavi se
                  </Link>
                )}
                <Button className="mt-3" render={<Link href="/plan" />}>
                  Planiraj putovanje
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
