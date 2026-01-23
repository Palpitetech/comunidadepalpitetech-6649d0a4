import { useEffect, useMemo, useRef, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import { ChatDaySeparator } from "@/components/chat/ChatDaySeparator";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { ChatQuickReplies } from "@/components/chat/ChatQuickReplies";
import { CHAT_TOPICS, type ChatTopicId, getChatTopic } from "@/lib/chatTopics";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO } from "date-fns";
import { Send } from "lucide-react";

export default function Chat() {
  const [selectedTopic, setSelectedTopic] = useState<ChatTopicId | null>(null);
  const [pendingStarter, setPendingStarter] = useState<string | null>(null);
  const topicMeta = useMemo(
    () => (selectedTopic ? CHAT_TOPICS.find((t) => t.id === selectedTopic) : undefined),
    [selectedTopic]
  );

  const { messages, loading, sending, error, remainingToday, sendMessage } = useChat({
    topic: selectedTopic,
  });

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handlePickTopic = async (id: ChatTopicId) => {
    const meta = getChatTopic(id);
    setSelectedTopic(id);
    setDraft("");
    if (meta?.starterUserMessage) setPendingStarter(meta.starterUserMessage);
  };

  useEffect(() => {
    if (!selectedTopic) return;
    if (!pendingStarter) return;
    void sendMessage(pendingStarter);
    setPendingStarter(null);
  }, [pendingStarter, selectedTopic, sendMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, sending, loading, selectedTopic]);

  const handleSend = async () => {
    if (!selectedTopic) return;
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await sendMessage(text);
  };

  return (
    <MainLayout>
      {/*
        No mobile existe o menu inferior fixo (h-16). Este padding garante que o composer
        fique sempre visível acima dele (inclui safe-area do iOS).
      */}
      <div className="flex h-full flex-col pb-[calc(env(safe-area-inset-bottom)+4rem)] md:pb-0">
        {/* Header minimalista */}
        <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <ChatAvatar />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-base font-semibold">
                  {topicMeta ? topicMeta.title : "Escolha um tema"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {topicMeta ? "Conversa ativa" : "Selecione uma opção abaixo para começar"}
                </p>
              </div>
            </div>

            {selectedTopic ? (
              <Button
                variant="ghost"
                className="h-9 rounded-full px-3 text-sm"
                onClick={() => {
                  setSelectedTopic(null);
                  setDraft("");
                  setPendingStarter(null);
                }}
              >
                Fechar chat
              </Button>
            ) : null}
          </div>

          {selectedTopic === "estatisticas" && remainingToday !== null && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Mensagens restantes hoje (estatísticas): <strong>{remainingToday}</strong>
            </p>
          )}
        </header>

        {/* Conteúdo */}
        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="flex-1">
            <div className="chat-wallpaper px-3 py-4 md:px-5">
              {!selectedTopic ? (
                <div className="flex items-end gap-2">
                  <ChatAvatar />
                  <ChatQuickReplies
                    topics={CHAT_TOPICS}
                    onPick={(t) => void handlePickTopic(t.id)}
                  />
                </div>
              ) : loading ? (
                <div className="flex items-end gap-2">
                  <ChatAvatar />
                  <ChatMessageBubble
                    role="assistant"
                    content="Carregando conversa..."
                    timeLabel={format(new Date(), "HH:mm")}
                    showTail
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.length === 0 ? (
                    <div className="flex items-end gap-2">
                      <ChatAvatar />
                      <ChatMessageBubble
                        role="assistant"
                        content={
                          "Sem mensagens ainda. Se quiser, escreva uma pergunta aqui embaixo."
                        }
                        timeLabel={format(new Date(), "HH:mm")}
                      />
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const prev = idx > 0 ? messages[idx - 1] : undefined;
                      const d = parseISO(m.created_at);
                      const prevDate = prev ? parseISO(prev.created_at) : null;
                      const showDaySeparator = !prevDate || !isSameDay(d, prevDate);
                      const timeLabel = format(d, "HH:mm");
                      const isAssistant = m.role === "assistant";
                      const showAvatar =
                        isAssistant && (!prev || prev.role !== "assistant" || showDaySeparator);

                      return (
                        <div key={m.id} className="space-y-2">
                          {showDaySeparator ? (
                            <ChatDaySeparator date={m.created_at} />
                          ) : null}

                          {isAssistant ? (
                            <div className="flex items-end gap-2">
                              {showAvatar ? <ChatAvatar /> : <div className="h-8 w-8" />}
                              <ChatMessageBubble
                                role="assistant"
                                content={m.content}
                                timeLabel={timeLabel}
                              />
                            </div>
                          ) : (
                            <div className="flex justify-end">
                              <ChatMessageBubble role="user" content={m.content} timeLabel={timeLabel} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {error && <p className="px-1 text-sm text-destructive">{error}</p>}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Composer */}
          <div className="border-t border-border bg-background/80 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex gap-2">
              <Input
                className="input-senior rounded-full"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  selectedTopic ? "Digite sua mensagem..." : "Escolha um tema acima para começar"
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={sending || !selectedTopic}
              />

              <Button
                className={cn("h-14 w-14 rounded-full", "btn-senior px-0")}
                onClick={() => void handleSend()}
                disabled={sending || !draft.trim() || !selectedTopic}
                aria-label="Enviar"
              >
                <Send className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
