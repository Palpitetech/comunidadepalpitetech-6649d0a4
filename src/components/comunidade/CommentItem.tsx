import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GuideBadge } from "./GuideBadge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CommentItemProps {
  comment: {
    id: string;
    conteudo: string;
    created_at: string;
    user_id: string;
    perfis: {
      nome: string | null;
      avatar_url: string | null;
      is_bot: boolean | null;
    } | null;
  };
  currentUserId?: string;
  onDelete?: (commentId: string) => void;
  isDeleting?: boolean;
}

export function CommentItem({
  comment,
  currentUserId,
  onDelete,
  isDeleting,
}: CommentItemProps) {
  const authorName = comment.perfis?.nome || "Usuário";
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const canDelete = currentUserId === comment.user_id;

  return (
    <div className="flex gap-3 py-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.perfis?.avatar_url || undefined} />
        <AvatarFallback className="text-xs bg-muted text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-medium text-sm text-foreground">
            {authorName}
          </span>
          {comment.perfis?.is_bot && <GuideBadge />}
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
          {comment.conteudo}
        </p>
      </div>

      {canDelete && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(comment.id)}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
