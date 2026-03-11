import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ChatTopicId } from "@/lib/chatTopics";

export type ChatRole = "user" | "assistant";

export interface ChatMessageActions {
  upgrade?: boolean;
  plan?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  created_at: string;
  bot_persona_id?: string | null;
  actions?: ChatMessageActions | null;
}

interface UseChatArgs {
  topic: ChatTopicId | null;
}

export function useChat({ topic }: UseChatArgs) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);

  const canLoad = useMemo(() => Boolean(topic), [topic]);

  const loadOrCreateConversation = useCallback(async () => {
    if (!topic) return;
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Usuário não autenticado");

      const { data: existing, error: existingError } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("topic", topic)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (existingError) throw existingError;

      let id = existing?.[0]?.id as string | undefined;
      if (!id) {
        const { data: created, error: createError } = await supabase
          .from("chat_conversations")
          .insert({ topic, user_id: userId })
          .select("id")
          .single();
        if (createError) throw createError;
        id = created.id;
      }

      setConversationId(id);

      const { data: msgs, error: msgsError } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at, bot_persona_id")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      if (msgsError) throw msgsError;

      setMessages((msgs || []) as any);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Erro ao carregar conversa");
    } finally {
      setLoading(false);
    }
  }, [topic]);

  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setRemainingToday(null);
    if (canLoad) void loadOrCreateConversation();
  }, [canLoad, loadOrCreateConversation]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!topic) return;
      const trimmed = content.trim();
      if (!trimmed) return;

      setSending(true);
      setError(null);

      try {
        const optimisticId = `optimistic-${Date.now()}`;
        const optimistic: ChatMessage = {
          id: optimisticId,
          role: "user",
          content: trimmed,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimistic]);

        const { data, error: fnError } = await supabase.functions.invoke("chat-assistant", {
          body: {
            topic,
            conversation_id: conversationId,
            message: trimmed,
          },
        });

        if (fnError) throw fnError;

        // Se o backend criou conversa, atualiza id
        if (data?.conversation_id && data.conversation_id !== conversationId) {
          setConversationId(data.conversation_id);
        }

        if (typeof data?.remaining_today === "number") {
          setRemainingToday(data.remaining_today);
        }

        // Recarrega histórico para garantir ordenação/ids reais
        const convIdToLoad = (data?.conversation_id as string | undefined) ?? conversationId;
        if (convIdToLoad) {
          const { data: msgs, error: msgsError } = await supabase
            .from("chat_messages")
            .select("id, role, content, created_at, bot_persona_id")
            .eq("conversation_id", convIdToLoad)
            .order("created_at", { ascending: true });
          if (msgsError) throw msgsError;
          setMessages((msgs || []) as any);
        }
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "Erro ao enviar mensagem");
      } finally {
        setSending(false);
      }
    },
    [conversationId, topic]
  );

  return {
    conversationId,
    messages,
    loading,
    sending,
    error,
    remainingToday,
    reload: loadOrCreateConversation,
    sendMessage,
  };
}
