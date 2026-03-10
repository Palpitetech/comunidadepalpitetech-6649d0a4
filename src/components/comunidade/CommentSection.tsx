import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentItem } from "./CommentItem";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  conteudo: string;
  created_at: string;
  user_id: string;
  parent_id?: string | null;
  perfis: {
    nome: string | null;
    avatar_url: string | null;
    is_bot: boolean | null;
  } | null;
  replies?: Comment[];
}

interface CommentSectionProps {
  comments: Comment[];
  commentsCount: number;
  currentUserId?: string;
  onAddComment: (content: string, parentId?: string) => void;
  onDeleteComment: (commentId: string) => void;
  isLoading?: boolean;
  isAdding?: boolean;
  deletingId?: string | null;
}

export function CommentSection({
  comments,
  commentsCount,
  currentUserId,
  onAddComment,
  onDeleteComment,
  isLoading,
  isAdding,
  deletingId,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment("");
    }
  };

  const handleReply = (content: string, parentId: string) => {
    onAddComment(content, parentId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pt-2">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {commentsCount} {commentsCount === 1 ? "comentário" : "comentários"}
        </span>
      </div>

      {/* New comment input */}
      <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-1 border border-border/40 focus-within:border-primary/40 focus-within:bg-muted/20 transition-all">
        <input
          ref={inputRef}
          type="text"
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 bg-transparent text-sm py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          onClick={handleSubmit}
          disabled={!newComment.trim() || isAdding}
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 shrink-0 rounded-lg transition-all",
            newComment.trim()
              ? "text-primary hover:text-primary hover:bg-primary/10"
              : "text-muted-foreground/40"
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="space-y-4 pt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2.5 animate-in fade-in duration-300" style={{ animationDelay: `${i * 100}ms` }}>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted/60 mb-3">
            <MessageCircle className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Sem comentários ainda
          </p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Inicie a conversa 💬
          </p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-border/30">
          {comments.map((comment, index) => (
            <div
              key={comment.id}
              className="animate-in fade-in slide-in-from-bottom-1 duration-200"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                onDelete={onDeleteComment}
                onReply={handleReply}
                isDeleting={deletingId === comment.id}
                isReplying={isAdding}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
