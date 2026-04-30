import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  conversation_id: string;
  phone_number: string;
  instance_id: string | null;
  direction: "inbound" | "outbound";
  content: string;
  evolution_message_id: string | null;
  status: string;
  received_at: string;
  expires_at: string;
}

export function useChatMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMessages = async () => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("received_at", { ascending: true });

      if (error) throw error;
      setMessages((data as any[]) || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    if (!conversationId) return;

    const channel = supabase
      .channel(`chat_messages_${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as any]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim()) return;

    try {
      // 1. Buscar a conversa para pegar phone_number e instance_id
      const { data: conversation, error: convError } = await supabase
        .from("whatsapp_chat_conversations")
        .select("phone_number, instance_id")
        .eq("id", conversationId)
        .single();

      if (convError || !conversation) throw new Error("Conversa não encontrada");

      // 2. Buscar evolution_instance_id da instância
      const { data: instance, error: instError } = await supabase
        .from("whatsapp_instances")
        .select("evolution_instance_id")
        .eq("id", conversation.instance_id)
        .single();

      if (instError || !instance) throw new Error("Instância não encontrada");

      // 3. Chamar Evolution API via evolution-proxy
      const { data: evoResult, error: evoError } = await supabase.functions.invoke("evolution-proxy", {
        body: {
          action: "sendText",
          instanceName: instance.evolution_instance_id,
          number: conversation.phone_number,
          text: content,
        },
      });

      if (evoError) throw evoError;

      // 4. Inserir mensagem no banco (outbound)
      const { error: msgError } = await supabase.from("whatsapp_chat_messages").insert({
        conversation_id: conversationId,
        phone_number: conversation.phone_number,
        instance_id: conversation.instance_id,
        direction: "outbound",
        content: content,
        status: "sent",
      });

      if (msgError) throw msgError;

      // 5. Atualizar conversa (last_message)
      await supabase.from("whatsapp_chat_conversations").update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100),
      }).eq("id", conversationId);

    } catch (err: any) {
      console.error("Error sending message:", err);
      toast({
        title: "Erro ao enviar mensagem",
        description: err.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const markAsRead = async () => {
    if (!conversationId) return;

    try {
      const { error } = await supabase
        .from("whatsapp_chat_conversations")
        .update({ unread_count: 0 })
        .eq("id", conversationId);

      if (error) throw error;
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
  };
}
