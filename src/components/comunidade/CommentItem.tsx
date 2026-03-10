import { useState } from "react";
import { Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const isOptimistic = comment.id.startsWith("optimistic-");
  const authorName = comment.perfis?.nome || "Você";
  const initials = authorName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR });
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
    <div className={cn(
      "py-3 transition-opacity duration-300",
      isNested && "ml-8 border-l-2 border-primary/10 pl-3",
      isOptimistic && "opacity-60"
    )}>
      <div className="flex gap-2.5">
        <Avatar className={cn("shrink-0", isNested ? "h-6 w-6" : "h-8 w-8")}>
          <AvatarImage src={comment.perfis?.avatar_url || undefined} />
          <AvatarFallback className={cn(
            "bg-muted text-muted-foreground font-medium",
            isNested ? "text-[8px]" : "text-[10px]"
          )}>
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Author line */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-xs text-foreground">{authorName}</span>
            {comment.perfis?.is_bot && <GuideBadge className="scale-90 origin-left" />}
            <span className="text-[11px] text-muted-foreground/60">·</span>
            <span className="text-[11px] text-muted-foreground/60">{timeAgo}</span>
          </div>

          {/* Comment body */}
          <p className="text-sm text-foreground/85 mt-1 whitespace-pre-wrap break-words leading-relaxed">
            {comment.conteudo}
          </p>

          {/* Actions */}
          <div className="mt-1.5 flex items-center gap-3">
            {depth === 0 && onReply && (
              <button
                className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                Responder
              </button>
            )}
            {canDelete && onDelete && (
              <button
                className="text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => onDelete(comment.id)}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply input */}
      {showReplyInput && (
        <div className="mt-2 ml-10 flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1 border border-border/30 focus-within:border-primary/30 transition-all animate-in fade-in slide-in-from-top-1 duration-200">
          <input
            type="text"
            placeholder={`Responder ${authorName}...`}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="flex-1 bg-transparent text-sm py-2 text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
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
            className="text-primary hover:text-primary/80 disabled:opacity-30 transition-colors p-1"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            onClick={() => { setShowReplyInput(false); setReplyContent(""); }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Nested replies */}
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
