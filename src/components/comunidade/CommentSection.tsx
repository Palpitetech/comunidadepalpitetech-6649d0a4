import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentItem } from "./CommentItem";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="space-y-3">
      {/* Header */}
      <p className="text-sm text-muted-foreground">
        {commentsCount} {commentsCount === 1 ? "comentário" : "comentários"}
      </p>

      {/* Input de novo comentário */}
      <div className="flex items-end gap-2">
        <input
          type="text"
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 bg-transparent border-b border-border text-sm py-2 px-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
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
          className="h-8 w-8 text-muted-foreground hover:text-primary flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista de comentários */}
      {isLoading ? (
        <div className="space-y-3 pt-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2.5">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          Seja o primeiro a comentar.
        </p>
      ) : (
        <div className="space-y-0">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onDelete={onDeleteComment}
              onReply={handleReply}
              isDeleting={deletingId === comment.id}
              isReplying={isAdding}
            />
          ))}
        </div>
      )}
    </div>
  );
}
