import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2, MessageSquare, FileText, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { ExtendedProfile, Plan } from "@/types/plans";

interface UserWithPlan extends ExtendedProfile {
  plan?: Plan | null;
}

interface UserModerationTabProps {
  user: UserWithPlan;
  onUserUpdated: () => void;
}

interface Post {
  id: string;
  conteudo: string;
  created_at: string;
}

interface Comment {
  id: string;
  conteudo: string;
  created_at: string;
}

export function UserModerationTab({ user, onUserUpdated }: UserModerationTabProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const fetchContent = async () => {
    try {
      const [postsRes, commentsRes] = await Promise.all([
        supabase
          .from("postagens")
          .select("id, conteudo, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("post_comments")
          .select("id, conteudo, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      if (postsRes.error) throw postsRes.error;
      if (commentsRes.error) throw commentsRes.error;

      setPosts(postsRes.data || []);
      setComments(commentsRes.data || []);
    } catch (error) {
      console.error("Erro ao buscar conteúdo:", error);
      toast.error("Erro ao carregar conteúdo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [user.id]);

  const handleDeletePost = async (postId: string) => {
    setDeleting(postId);
    try {
      const { error } = await supabase.from("postagens").delete().eq("id", postId);
      if (error) throw error;
      toast.success("Post excluído");
      fetchContent();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast.error(error.message || "Erro ao excluir post");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeleting(commentId);
    try {
      const { error } = await supabase.from("post_comments").delete().eq("id", commentId);
      if (error) throw error;
      toast.success("Comentário excluído");
      fetchContent();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast.error(error.message || "Erro ao excluir comentário");
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const [postsRes, commentsRes] = await Promise.all([
        supabase.from("postagens").delete().eq("user_id", user.id),
        supabase.from("post_comments").delete().eq("user_id", user.id),
      ]);

      if (postsRes.error) throw postsRes.error;
      if (commentsRes.error) throw commentsRes.error;

      toast.success("Todo conteúdo excluído");
      fetchContent();
      onUserUpdated();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast.error(error.message || "Erro ao excluir conteúdo");
    } finally {
      setDeletingAll(false);
    }
  };

  const truncate = (text: string, length: number = 100) => {
    if (text.length <= length) return text;
    return text.slice(0, length) + "...";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Posts */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Posts Recentes ({posts.length})</span>
        </div>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum post encontrado</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{truncate(post.conteudo)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(post.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleDeletePost(post.id)}
                    disabled={deleting === post.id}
                  >
                    {deleting === post.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Comentários */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Comentários Recentes ({comments.length})</span>
        </div>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum comentário encontrado</p>
        ) : (
          <div className="space-y-2">
            {comments.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="p-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{truncate(comment.conteudo)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deleting === comment.id}
                  >
                    {deleting === comment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Ação Destrutiva */}
      {(posts.length > 0 || comments.length > 0) && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full gap-2"
              disabled={deletingAll}
            >
              {deletingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              Apagar Todo o Conteúdo
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão total</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá excluir TODOS os posts e comentários deste usuário.
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
