import { useState } from "react";
import { Trash2, Reply, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GuideBadge } from "./GuideBadge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CommentData {
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
  replies?: CommentData[];
}

interface CommentItemProps {
  comment: CommentData;
  currentUserId?: string;
  onDelete?: (commentId: string) => void;
  onReply?: (content: string, parentId: string) => void;
  isDeleting?: boolean;
  isReplying?: boolean;
  depth?: number;
}

export function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onReply,
  isDeleting,
  isReplying,
  depth = 0,
}: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");

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
  const isNested = depth > 0;

  const handleSubmitReply = () => {
    if (replyContent.trim() && onReply) {
      onReply(replyContent.trim(), comment.id);
      setReplyContent("");
      setShowReplyInput(false);
    }
  };

  return (
    <div className={cn("py-2.5", isNested && "ml-7 border-l border-border/50 pl-3")}>
      <div className="flex gap-2.5">
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarImage src={comment.perfis?.avatar_url || undefined} />
          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-medium text-xs text-foreground">
              {authorName}
            </span>
            {comment.perfis?.is_bot && <GuideBadge />}
            <span className="text-[11px] text-muted-foreground/70">{timeAgo}</span>
          </div>
          <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
            {comment.conteudo}
          </p>

          {/* Ações inline */}
          {depth === 0 && (
            <div className="mt-1 flex items-center gap-3">
              {onReply && (
                <button
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowReplyInput(!showReplyInput)}
                >
                  Responder
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                  onClick={() => onDelete(comment.id)}
                  disabled={isDeleting}
                >
                  Excluir
                </button>
              )}
            </div>
          )}

          {/* Delete para respostas aninhadas */}
          {isNested && canDelete && onDelete && (
            <button
              className="mt-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
              onClick={() => onDelete(comment.id)}
              disabled={isDeleting}
            >
              Excluir
            </button>
          )}
        </div>
      </div>

      {/* Input de resposta */}
      {showReplyInput && (
        <div className="mt-2 ml-9 flex items-end gap-2">
          <input
            type="text"
            placeholder={`Responder ${authorName}...`}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="flex-1 bg-transparent border-b border-border text-sm py-1.5 px-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmitReply();
              }
            }}
            autoFocus
          />
          <button
            onClick={handleSubmitReply}
            disabled={!replyContent.trim() || isReplying}
            className="text-muted-foreground hover:text-primary disabled:opacity-30 transition-colors p-1"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            onClick={() => {
              setShowReplyInput(false);
              setReplyContent("");
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Respostas aninhadas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onDelete={onDelete}
              isDeleting={isDeleting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
