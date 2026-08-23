import { GENERATION_MESSAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function LoadingState({
  message = "Učitavamo...",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}>
      <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function TripGeneratingOverlay({ message }: { message: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto size-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="mt-5 font-heading text-2xl">{message}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ovo traje kratko. Ne prikazujemo lažne procente.
        </p>
        <ul className="mt-6 space-y-1 text-left text-sm text-muted-foreground">
          {GENERATION_MESSAGES.map((item) => (
            <li key={item} className={item === message ? "text-foreground" : ""}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
