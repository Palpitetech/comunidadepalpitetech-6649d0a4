import { useState } from "react";
import { X, StickyNote, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface FloatingNotesProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
}

export function FloatingNotes({ isOpen, onClose, initialContent = "" }: FloatingNotesProps) {
  const [content, setContent] = useState(initialContent);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          size="sm"
          variant="default"
          className="gap-2 shadow-lg"
          onClick={() => setIsMinimized(false)}
        >
          <StickyNote className="h-4 w-4" />
          Notas
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-lg border bg-card shadow-xl">
      <div className="flex items-center justify-between p-2 border-b bg-muted/50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">Bloco de Notas</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="p-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Anote suas observações sobre a análise..."
          className="min-h-[120px] text-xs resize-none border-0 focus-visible:ring-0 bg-transparent"
        />
      </div>
    </div>
  );
}
