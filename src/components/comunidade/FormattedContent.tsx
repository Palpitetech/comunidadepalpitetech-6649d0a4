import { memo, useMemo } from "react";

interface FormattedContentProps {
  content: string;
  className?: string;
  truncate?: boolean;
  maxLines?: number;
}

/**
 * Renders community post content with light markdown support:
 * - **bold** → <strong>
 * - Lines starting with • or - → styled list items
 * - Emoji section headers (lines starting with emoji) → larger weight
 * - Line breaks preserved
 */
export const FormattedContent = memo(function FormattedContent({
  content,
  className = "",
  truncate = false,
  maxLines = 2,
}: FormattedContentProps) {
  const rendered = useMemo(() => {
    if (!content) return null;

    const lines = content.split("\n");

    return lines.map((line, i) => {
      if (!line.trim()) return <br key={i} />;

      // Process bold markers
      const parts = processInlineFormatting(line.trim());

      // Detect list items (• or -)
      const isList = /^[•\-–]\s/.test(line.trim());
      // Detect emoji section headers (line starts with emoji, short-ish)
      const isEmojiHeader = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(line.trim()) && line.trim().length < 80 && !isList;

      if (isList) {
        return (
          <div key={i} className="flex gap-1.5 ml-1 text-muted-foreground">
            <span className="text-primary/70 shrink-0">•</span>
            <span>{parts}</span>
          </div>
        );
      }

      if (isEmojiHeader) {
        return (
          <p key={i} className="font-semibold text-foreground mt-1.5 first:mt-0">
            {parts}
          </p>
        );
      }

      return (
        <p key={i} className="text-muted-foreground">
          {parts}
        </p>
      );
    });
  }, [content]);

  if (truncate) {
    return (
      <div
        className={`text-xs space-y-0.5 ${className}`}
        style={{
          display: "-webkit-box",
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {rendered}
      </div>
    );
  }

  return <div className={`text-sm space-y-1 ${className}`}>{rendered}</div>;
});

/** Converts **bold** markers to <strong> elements */
function processInlineFormatting(text: string): React.ReactNode[] {
  // Remove leading bullet chars for display
  const cleaned = text.replace(/^[•\-–]\s*/, "");
  
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      parts.push(cleaned.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-semibold text-foreground">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < cleaned.length) {
    parts.push(cleaned.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [cleaned];
}
