import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash2, ExternalLink, MessageSquare, Heart } from "lucide-react";
import type { BotWithStats } from "@/types/bots";

interface BotPostsTabProps {
  bot: BotWithStats;
}

interface BotPost {
  id: string;
  titulo: string | null;
  conteudo: string;
  created_at: string;
  curtidas: number;
  respostas_count: number;
  loteria_tag: string | null;
}

export function BotPostsTab({ bot }: BotPostsTabProps) {
  const [posts, setPosts] = useState<BotPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [bot.perfil_id]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("postagens")
        .select("id, titulo, conteudo, created_at, curtidas, respostas_count, loteria_tag")
        .eq("user_id", bot.perfil_id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error("Erro ao buscar posts:", err);
      toast.error("Erro ao carregar posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Tem certeza que deseja excluir este post?")) return;

    try {
      const { error } = await supabase.from("postagens").delete().eq("id", postId);
      if (error) throw error;

      toast.success("Post excluído");
      fetchPosts();
    } catch (err) {
      console.error("Erro ao excluir post:", err);
      toast.error("Erro ao excluir post");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Este bot ainda não criou nenhum post.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {posts.length} post{posts.length !== 1 ? "s" : ""} encontrado
          {posts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {posts.map((post) => (
        <Card key={post.id} className="group">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {post.titulo && (
                  <h4 className="font-medium text-sm line-clamp-1">{post.titulo}</h4>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {post.conteudo}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{new Date(post.created_at).toLocaleDateString("pt-BR")}</span>
                  {post.loteria_tag && <Badge variant="outline" className="text-xs">{post.loteria_tag}</Badge>}
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.curtidas}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {post.respostas_count}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(`/comunidade/post/${post.id}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
