export function PlaceMarker({
  selected,
  index,
}: {
  selected?: boolean;
  index?: number;
}) {
  return (
    <div
      className={`flex size-8 items-center justify-center rounded-full border-2 text-xs font-medium shadow ${
        selected
          ? "border-white bg-primary text-primary-foreground"
          : "border-white bg-foreground text-background"
      }`}
    >
      {index ?? ""}
    </div>
  );
}
