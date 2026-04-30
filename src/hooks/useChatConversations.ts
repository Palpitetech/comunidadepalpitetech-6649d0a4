import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  id: string;
  phone_number: string;
  profile_name: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  instance_id: string | null;
  created_at: string;
}

export function useChatConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_chat_conversations")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel("chat_conversations_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_chat_conversations",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setConversations((prev) => [payload.new as Conversation, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setConversations((prev) => {
              const updated = prev.map((c) =>
                c.id === payload.new.id ? (payload.new as Conversation) : c
              );
              // Reordena por last_message_at
              return updated.sort((a, b) => {
                const dateA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
                const dateB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
                return dateB - dateA;
              });
            });
          } else if (payload.eventType === "DELETE") {
            setConversations((prev) => prev.filter((c) => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalUnread = conversations.reduce((acc, curr) => acc + (curr.unread_count || 0), 0);

  return {
    conversations,
    loading,
    refetch: fetchConversations,
    totalUnread,
  };
}
