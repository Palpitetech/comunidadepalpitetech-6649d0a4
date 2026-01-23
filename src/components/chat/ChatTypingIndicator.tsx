type ChatTypingIndicatorProps = {
  reducedMotion?: boolean;
};

export function ChatTypingIndicator({ reducedMotion = false }: ChatTypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>digitando</span>
      {reducedMotion ? (
        <span aria-hidden>...</span>
      ) : (
        <span className="inline-flex items-center gap-1" aria-hidden>
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60"
            style={{ animationDelay: "200ms" }}
          />
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground/60"
            style={{ animationDelay: "400ms" }}
          />
        </span>
      )}
    </div>
  );
}
