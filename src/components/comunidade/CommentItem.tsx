import { useState } from "react";
import { Trash2, Reply, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    <div className={cn("py-3", isNested && "ml-8 border-l-2 border-muted pl-4")}>
      <div className="flex gap-3">
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

          {/* Botões de ação */}
          {depth === 0 && onReply && (
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                <Reply className="h-3.5 w-3.5 mr-1" />
                Responder
              </Button>
            </div>
          )}
        </div>

        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={() => onDelete(comment.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Input de resposta */}
      {showReplyInput && (
        <div className="mt-3 ml-11 flex gap-2">
          <Textarea
            placeholder={`Responder a ${authorName}...`}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[60px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitReply();
              }
            }}
          />
          <div className="flex flex-col gap-1">
            <Button
              onClick={handleSubmitReply}
              disabled={!replyContent.trim() || isReplying}
              size="icon"
              className="h-8 w-8"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setShowReplyInput(false);
                setReplyContent("");
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Respostas aninhadas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
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
