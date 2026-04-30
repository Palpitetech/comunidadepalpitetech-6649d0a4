import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, User } from "lucide-react";
import { Conversation } from "@/hooks/useChatConversations";
import { formatPhoneDisplay, formatChatTime, truncatePreview } from "@/lib/chatUtils";
import { Skeleton } from "@/components/ui/skeleton";

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const ConversationList = ({ conversations, loading, selectedId, onSelect }: ConversationListProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = conversations.filter((c) => {
    const search = searchTerm.toLowerCase();
    const name = (c.profile_name || "").toLowerCase();
    const phone = c.phone_number.toLowerCase();
    return name.includes(search) || phone.includes(search);
  });

  if (loading && conversations.length === 0) {
    return (
      <div className="flex flex-col h-full p-4 space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded-md" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <h1 className="text-xl font-bold mb-4">Conversas</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`flex items-center p-4 space-x-3 transition-colors hover:bg-muted/50 text-left border-b last:border-0 ${
                  selectedId === conv.id ? "bg-muted shadow-sm" : ""
                }`}
              >
                <Avatar className="h-12 w-12 border">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold truncate">
                      {conv.profile_name || formatPhoneDisplay(conv.phone_number)}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatChatTime(conv.last_message_at)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground truncate mr-2">
                      {truncatePreview(conv.last_message_preview, 45)}
                    </p>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="rounded-full px-2 min-w-[1.25rem] h-5 flex items-center justify-center text-[10px]">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
