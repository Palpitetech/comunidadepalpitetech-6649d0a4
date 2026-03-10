import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function usePostActions(postId: string) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const toggleLikeMutation = useMutation({
    mutationFn: async (isCurrentlyLiked: boolean) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      if (isCurrentlyLiked) {
        // Remove like
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["post-like", postId] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
    onError: () => {
      toast.error("Erro ao atualizar curtida");
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          conteudo: content,
          parent_id: parentId || null,
        });

      if (error) throw error;
    },
    onMutate: async ({ content, parentId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["post-comments", postId] });

      // Snapshot previous comments
      const previous = queryClient.getQueryData(["post-comments", postId]);

      // Optimistically add comment
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        conteudo: content,
        created_at: new Date().toISOString(),
        user_id: user?.id || "",
        parent_id: parentId || null,
        perfis: null, // will resolve on refetch
        replies: [],
      };

      queryClient.setQueryData(["post-comments", postId], (old: any[] | undefined) => {
        if (!old) return [optimistic];
        if (parentId) {
          return old.map((c: any) =>
            c.id === parentId
              ? { ...c, replies: [...(c.replies || []), optimistic] }
              : c
          );
        }
        return [...old, optimistic];
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["post-comments", postId], context.previous);
      }
      toast.error("Erro ao adicionar comentário");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      setDeletingCommentId(commentId);
      const { error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      toast.success("Comentário removido");
      setDeletingCommentId(null);
    },
    onError: () => {
      toast.error("Erro ao remover comentário");
      setDeletingCommentId(null);
    },
  });

  return {
    toggleLike: toggleLikeMutation.mutate,
    isTogglingLike: toggleLikeMutation.isPending,
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
    deleteComment: deleteCommentMutation.mutate,
    deletingCommentId,
  };
}
