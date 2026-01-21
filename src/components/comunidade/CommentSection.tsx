import { useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommentItem } from "./CommentItem";
import { Skeleton } from "@/components/ui/skeleton";

interface Comment {
  id: string;
  conteudo: string;
  created_at: string;
  user_id: string;
  perfis: {
    nome: string | null;
    avatar_url: string | null;
  } | null;
}

interface CommentSectionProps {
  comments: Comment[];
  commentsCount: number;
  currentUserId?: string;
  onAddComment: (content: string) => void;
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">
          Comentários ({commentsCount})
        </h3>
      </div>

      {/* Input de novo comentário */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Escrever comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          onClick={handleSubmit}
          disabled={!newComment.trim() || isAdding}
          size="icon"
          className="h-10 w-10 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista de comentários */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onDelete={onDeleteComment}
              isDeleting={deletingId === comment.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
