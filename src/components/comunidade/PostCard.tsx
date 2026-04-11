import { memo } from "react";
import { FormattedContent } from "./FormattedContent";
import { Heart, MessageCircle, ChevronRight, Share2, MoreHorizontal } from "lucide-react";
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
      className="bg-card border-none rounded-[1.5rem] p-5 cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-300"
    >
      {/* Header moderno */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-10 w-10 ring-2 ring-primary/10">
          <AvatarImage src={post.perfis?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate leading-tight">
            {authorName}
          </p>
          <p className="text-[11px] text-muted-foreground/80 font-medium">
            {timeAgo}
          </p>
        </div>
        <button className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/80">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Título mais chamativo */}
      {post.titulo && (
        <h3 className="font-bold text-base text-foreground mb-3 leading-snug tracking-tight">
          {post.titulo}
        </h3>
      )}

      {/* Thumbnail da Mídia com sombra e bordas arredondadas maiores */}
      {post.media_url && (
        <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-muted shadow-sm">
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
          {post.loteria_tag && (
            <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {post.loteria_tag}
            </div>
          )}
        </div>
      )}

      {/* Conteúdo resumido com melhor tipografia */}
      {!post.media_url && post.conteudo && (
        <FormattedContent
          content={post.conteudo}
          truncate
          maxLines={3}
          className="mb-4 text-sm leading-relaxed text-muted-foreground/90 font-medium italic"
        />
      )}

      {/* Footer com botões de interação modernos */}
      <div className="flex items-center justify-between pt-3 border-t border-muted/50 mt-1">
        <div className="flex items-center gap-5 text-muted-foreground/80">
          <button className="flex items-center gap-1.5 text-xs font-bold hover:text-primary transition-colors">
            <Heart className="h-4 w-4" />
            {post.curtidas || 0}
          </button>
          <button className="flex items-center gap-1.5 text-xs font-bold hover:text-primary transition-colors">
            <MessageCircle className="h-4 w-4" />
            {post.respostas_count || 0}
          </button>
          <button className="flex items-center gap-1.5 text-xs font-bold hover:text-primary transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-primary font-bold uppercase tracking-wider group">
          Ver post
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </article>
  );
});