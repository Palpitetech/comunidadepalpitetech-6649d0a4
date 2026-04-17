import { memo } from "react";
import { FormattedContent } from "./FormattedContent";
import { Heart, MessageCircle, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PostCardProps {
  post: {
    id: string;
    titulo: string | null;
    conteudo: string;
    loteria_tag: string | null;
    media_url: string | null;
    media_type: string | null;
    curtidas: number | null;
    respostas_count: number | null;
    created_at: string;
    perfis: {
      nome: string | null;
      avatar_url: string | null;
      is_bot: boolean | null;
    } | null;
  };
  onClick: () => void;
  onPrefetch?: () => void;
}

export const PostCard = memo(function PostCard({ post, onClick, onPrefetch }: PostCardProps) {
  const authorName = post.perfis?.nome || "Usuário";
  const initials = authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <article
      onClick={onClick}
      onPointerEnter={onPrefetch}
      className="bg-card border border-border/60 rounded-xl p-3 cursor-pointer shadow-md active:scale-[0.98] transition-transform duration-150"
    >
      {/* Header compacto */}
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-7 w-7">
          <AvatarImage src={post.perfis?.avatar_url || undefined} />
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-sm text-foreground truncate">
          {authorName}
        </span>
        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
          {timeAgo}
        </span>
      </div>

      {/* Título */}
      {post.titulo && (
        <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2">
          {post.titulo}
        </h3>
      )}

      {/* Thumbnail da Mídia */}
      {post.media_url && (
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-muted">
          {post.media_type === "video" ? (
            <video
              src={post.media_url}
              className="w-full h-full object-cover"
              muted
            />
          ) : (
            <img
              src={post.media_url}
              alt="Mídia do post"
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
      )}

      {/* Conteúdo resumido */}
      {!post.media_url && post.conteudo && (
        <FormattedContent
          content={post.conteudo}
          truncate
          maxLines={2}
          className="mb-2"
        />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="flex items-center gap-1 text-xs">
            <Heart className="h-3.5 w-3.5" />
            {post.curtidas || 0}
          </span>
          <span className="flex items-center gap-1 text-xs">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.respostas_count || 0}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs text-primary font-medium">
          Continue lendo
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  );
});
