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
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-[#930089]"
              style={{
                animation: "chat-dot-wave 1.2s ease-in-out infinite",
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </span>
      )}

      <style>{`
        @keyframes chat-dot-wave {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}