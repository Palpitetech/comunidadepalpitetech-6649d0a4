import React, { useEffect, useRef, useState } from "react";
import { isValid } from "date-fns";
import { useChatMessages } from "@/hooks/useChatMessages";
import { MessageBubble } from "./MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageSquare, Loader2, Phone } from "lucide-react";
import { formatPhoneDisplay } from "@/lib/chatUtils";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface ChatWindowProps {
  conversationId: string | null;
  onBack?: () => void;
}

export const ChatWindow = ({ conversationId, onBack }: ChatWindowProps) => {
  const { messages, loading, sendMessage, markAsRead } = useChatMessages(conversationId);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationInfo, setConversationInfo] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      markAsRead();
      fetchConversationInfo();
    }
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const fetchConversationInfo = async () => {
    const { data } = await supabase
      .from("whatsapp_chat_conversations")
      .select("*, whatsapp_instances(friendly_name, evolution_instance_id)")
      .eq("id", conversationId)
      .single();
    setConversationInfo(data);
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    await sendMessage(inputText);
    setInputText("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <div className="bg-muted/50 p-6 rounded-full mb-4">
          <MessageSquare className="h-12 w-12" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Selecione uma conversa</h3>
        <p className="text-center max-w-xs">Escolha um contato na lista ao lado para começar a conversar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-background">
      {/* Header */}
      <div className="h-16 px-4 md:px-6 flex items-center border-b bg-background shadow-sm shrink-0">
        <div className="flex items-center space-x-3 w-full ml-10 md:ml-0">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold truncate">
              {conversationInfo?.profile_name || formatPhoneDisplay(conversationInfo?.phone_number || "")}
            </h2>
            <div className="flex items-center text-xs text-muted-foreground">
              <Phone className="h-3 w-3 mr-1" />
              <span>{formatPhoneDisplay(conversationInfo?.phone_number || "")}</span>
              {conversationInfo?.whatsapp_instances?.friendly_name && (
                <Badge variant="outline" className="ml-2 text-[10px] h-4 py-0">
                  {conversationInfo.whatsapp_instances.friendly_name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="flex flex-col space-y-2">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            messages.map((msg: any, index: number) => {
              const prevMsg = messages[index - 1];
              const msgDateStr = msg.received_at && isValid(new Date(msg.received_at)) 
                ? new Date(msg.received_at).toDateString() 
                : null;
              const prevMsgDateStr = prevMsg?.received_at && isValid(new Date(prevMsg.received_at))
                ? new Date(prevMsg.received_at).toDateString()
                : null;
              const showDateSeparator = !prevMsg || msgDateStr !== prevMsgDateStr;
              
              return (
                <React.Fragment key={msg.id}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-4">
                      <span className="bg-background/80 backdrop-blur px-3 py-1 rounded-full text-[11px] font-medium shadow-sm border uppercase">
                        {msg.received_at && isValid(new Date(msg.received_at))
                          ? new Date(msg.received_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : ""}
                      </span>
                    </div>
                  )}
                  <MessageBubble message={msg} />
                </React.Fragment>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 bg-background border-t shrink-0">
        <div className="flex items-end space-x-2 max-w-5xl mx-auto">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            className="min-h-[44px] max-h-32 resize-none bg-muted/30 focus-visible:ring-primary"
            rows={1}
          />
          <Button 
            onClick={handleSend} 
            disabled={!inputText.trim() || sending}
            size="icon"
            className="shrink-0 h-[44px] w-[44px] rounded-full"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
