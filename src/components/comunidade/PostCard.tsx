import { Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LoteriaBadge } from "./LoteriaBadge";
import { GuideBadge } from "./GuideBadge";
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
}

export function PostCard({ post, onClick }: PostCardProps) {
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
      className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:bg-muted/30 transition-colors"
    >
      {/* Header: Avatar + Nome + Badge */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={post.perfis?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground truncate">
              {authorName}
            </span>
            {post.perfis?.is_bot && <GuideBadge />}
            {post.loteria_tag && <LoteriaBadge tag={post.loteria_tag} />}
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>

      {/* Título */}
      {post.titulo && (
        <h3 className="font-semibold text-base text-foreground mb-2 line-clamp-2">
          {post.titulo}
        </h3>
      )}

      {/* Thumbnail da Mídia */}
      {post.media_url && (
        <div className="relative aspect-video rounded-lg overflow-hidden mb-3 bg-muted">
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
            />
          )}
        </div>
      )}

      {/* Conteúdo resumido (se não tiver mídia) */}
      {!post.media_url && post.conteudo && (
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {post.conteudo}
        </p>
      )}

      {/* Footer: Indicadores (não são botões) */}
      <div className="flex items-center gap-4 text-muted-foreground">
        <span className="flex items-center gap-1.5 text-sm">
          <Heart className="h-4 w-4" />
          {post.curtidas || 0}
        </span>
        <span className="flex items-center gap-1.5 text-sm">
          <MessageCircle className="h-4 w-4" />
          {post.respostas_count || 0}
        </span>
      </div>
    </article>
  );
}
