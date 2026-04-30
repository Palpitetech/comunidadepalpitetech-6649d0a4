import React, { useState, useEffect } from "react";
import { useChatConversations } from "@/hooks/useChatConversations";
import { ConversationList } from "@/components/admin/chat/ConversationList";
import { ChatWindow } from "@/components/admin/chat/ChatWindow";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/layout/AdminLayout";

const ChatAdmin = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const { conversations, loading, totalUnread } = useChatConversations();
  const isMobile = useIsMobile();

  // Se estiver no mobile e uma conversa for selecionada, escondemos a lista
  const showList = !isMobile || !selectedConversationId;
  const showChat = !isMobile || !!selectedConversationId;

  const content = (
    <div className="flex bg-background h-[calc(100vh-3.5rem)] w-full overflow-hidden border-t">
      {/* Sidebar / Lista de Conversas */}
      {showList && (
        <div className={`${isMobile ? 'w-full' : 'w-[350px] border-r'} flex flex-col h-full bg-muted/30`}>
          <ConversationList
            conversations={conversations}
            loading={loading}
            selectedId={selectedConversationId}
            onSelect={(id) => setSelectedConversationId(id)}
          />
        </div>
      )}

      {/* Janela de Chat */}
      {showChat && (
        <div className="flex-1 flex flex-col h-full bg-background relative">
          {isMobile && selectedConversationId && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 left-3 z-10"
              onClick={() => setSelectedConversationId(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <ChatWindow
            conversationId={selectedConversationId}
            onBack={() => setSelectedConversationId(null)}
          />
        </div>
      )}
    </div>
  );

  return (
    <AdminLayout pageTitle="Chat Central">
      {content}
    </AdminLayout>
  );
};

export default ChatAdmin;
