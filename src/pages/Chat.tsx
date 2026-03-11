import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatAvatar } from "@/components/chat/ChatAvatar";
import { ChatDaySeparator } from "@/components/chat/ChatDaySeparator";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { ChatQuickReplies } from "@/components/chat/ChatQuickReplies";
import { ChatTypingIndicator } from "@/components/chat/ChatTypingIndicator";
import { ChatAIGateModal } from "@/components/chat/ChatAIGateModal";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { LOTTERY_TOPICS, type ChatTopicId, getChatTopic } from "@/lib/chatTopics";
import { useChat } from "@/hooks/useChat";
import { useAssistantTypingSimulation } from "@/hooks/useAssistantTypingSimulation";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { usePermissions } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO } from "date-fns";
import { ArrowLeft, Send, Sparkles } from "lucide-react";

export default function Chat() {
  const isMobile = useIsMobile();
  const { hasPermission } = usePermissions();
  const [selectedTopic, setSelectedTopic] = useState<ChatTopicId | null>(null);
  const [pendingStarter, setPendingStarter] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateLottery, setGateLottery] = useState("");
  const [limitUpgradeOpen, setLimitUpgradeOpen] = useState(false);

  const topicMeta = useMemo(
    () => (selectedTopic ? getChatTopic(selectedTopic) : undefined),
    [selectedTopic]
  );

  const { messages, loading, sending, error, usage, sendMessage } = useChat({
    topic: selectedTopic,
  });

  const prefersReducedMotion = usePrefersReducedMotion();
  const { uiMessages, isSimulatingTyping } = useAssistantTypingSimulation({
    enabled: Boolean(selectedTopic),
    messages,
    prefersReducedMotion,
  });

  const showTyping = Boolean(selectedTopic) && (sending || isSimulatingTyping);

  // Compute remaining messages
  const isVip = usage?.is_vip === true;
  const remaining = usage && !isVip && typeof usage.count === "number" && typeof usage.limit === "number"
    ? Math.max(0, usage.limit - usage.count)
    : null;
  const limitReached = remaining === 0;

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const handlePickTopic = async (id: ChatTopicId, title: string) => {
    if (!hasPermission("chat_estatisticas")) {
      setGateLottery(title);
      setGateOpen(true);
      return;
    }
    const meta = getChatTopic(id);
    setSelectedTopic(id);
    setDraft("");
    if (meta?.starterUserMessage) setPendingStarter(meta.starterUserMessage);
  };

  const goBack = () => {
    setSelectedTopic(null);
    setDraft("");
    setPendingStarter(null);
  };

  useEffect(() => {
    if (!selectedTopic) return;
    if (!pendingStarter) return;
    void sendMessage(pendingStarter);
    setPendingStarter(null);
  }, [pendingStarter, selectedTopic, sendMessage]);

  // Auto-scroll suave
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [uiMessages.length, sending, loading, selectedTopic, showTyping, isSimulatingTyping]);

  const handleSend = async () => {
    if (!selectedTopic) return;
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await sendMessage(text);
  };

  const topicLabels: Record<string, string> = {
    estrategias: "Especialista Lotofácil",
    estrategias_megasena: "Especialista Mega-Sena",
    estrategias_duplasena: "Especialista Dupla Sena",
    conhecer_planos: "Consultor de Planos",
  };

  return (
    <MainLayout pageTitle="Chat">
      <div className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden md:h-full" style={{ background: "#F8F9FA" }}>
        {/* Header */}
        {selectedTopic ? (
          <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goBack}
                className="shrink-0 rounded-full p-1 hover:bg-muted transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-5 w-5 text-foreground" />
              </button>
              <ChatAvatar />
              <div className="min-w-0 leading-tight flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {topicLabels[selectedTopic] ?? "Especialista"}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </span>
                  <p className="text-[0.6rem] text-muted-foreground">
                    IA Avançada • Online
                  </p>
                </div>
              </div>
            </div>
          </header>
        ) : !isMobile ? (
          <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-3 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-4">
            <div className="flex items-center gap-3">
              <ChatAvatar />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-base font-semibold">Escolha uma loteria</p>
              </div>
            </div>
          </header>
        ) : null}

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col">
          <ScrollArea className="flex-1">
            <div className="px-3 py-4 pb-[calc(env(safe-area-inset-bottom)+4rem+6rem)] md:px-5 md:pb-28">
              {!selectedTopic ? (
                <div className="flex items-end gap-2">
                  <ChatAvatar />
                  <ChatQuickReplies
                    topics={LOTTERY_TOPICS}
                    onPick={(t) => void handlePickTopic(t.id, t.title)}
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
                  {uiMessages.length === 0 ? (
                    <div className="flex items-end gap-2">
                      <ChatAvatar />
                      <ChatMessageBubble
                        role="assistant"
                        content="Sem mensagens ainda. Se quiser, escreva uma pergunta aqui embaixo."
                        timeLabel={format(new Date(), "HH:mm")}
                      />
                    </div>
                  ) : (
                    uiMessages.map((m, idx) => {
                      const prev = idx > 0 ? uiMessages[idx - 1] : undefined;
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
                              {showAvatar ? <ChatAvatar /> : <div className="h-9 w-9" />}
                              <ChatMessageBubble
                                role="assistant"
                                content={m.content}
                                timeLabel={timeLabel}
                                actions={m.actions}
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

                  {showTyping ? (
                    <div className="flex items-end gap-2">
                      <ChatAvatar />
                      <ChatMessageBubble
                        role="assistant"
                        content=""
                        showTail={
                          uiMessages.length === 0 || uiMessages[uiMessages.length - 1]?.role !== "assistant"
                        }
                      >
                        <ChatTypingIndicator reducedMotion={prefersReducedMotion} />
                      </ChatMessageBubble>
                    </div>
                  ) : null}

                  {error && <p className="px-1 text-sm text-destructive">{error}</p>}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Limit reached banner */}
          {selectedTopic && limitReached && (
            <div className="fixed left-0 right-0 z-50 border-t border-border bg-destructive/10 px-3 py-2 text-center bottom-[calc(env(safe-area-inset-bottom)+4rem+3.5rem)] md:bottom-[3.5rem]">
              <p className="text-xs text-foreground mb-1.5">
                Limite diário atingido · Plano VIP é ilimitado
              </p>
              <Button
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => setLimitUpgradeOpen(true)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                👑 Desbloquear acesso ilimitado
              </Button>
            </div>
          )}

          {/* Last message warning */}
          {selectedTopic && remaining === 1 && !limitReached && (
            <div className="fixed left-0 right-0 z-50 border-t border-[hsl(var(--warning,40_100%_50%))]/30 bg-[hsl(var(--warning,40_100%_50%))]/10 px-3 py-1.5 text-center text-xs text-foreground bottom-[calc(env(safe-area-inset-bottom)+4rem+3.5rem)] md:bottom-[3.5rem]">
              ⚠️ Última mensagem gratuita de hoje
            </div>
          )}

          {/* Composer */}
          <div
            className={cn(
              "fixed left-0 right-0 z-50 border-t border-border bg-background/80 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/60",
              "bottom-[calc(env(safe-area-inset-bottom)+4rem)]",
              "md:bottom-0"
            )}
          >
            <div className="mx-auto flex max-w-3xl gap-2 md:max-w-4xl">
              <Input
                className="input-senior rounded-full"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  limitReached
                    ? "Limite diário atingido"
                    : selectedTopic
                      ? "Digite sua mensagem..."
                      : "Escolha uma loteria acima para começar"
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={sending || !selectedTopic || limitReached}
              />

              <Button
                className={cn("h-14 w-14 rounded-full", "btn-senior px-0")}
                onClick={() => void handleSend()}
                disabled={sending || !draft.trim() || !selectedTopic || limitReached}
                aria-label="Enviar"
              >
                <Send className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gate modal for non-VIP users */}
      <ChatAIGateModal
        open={gateOpen}
        onOpenChange={setGateOpen}
        lotteryName={gateLottery}
      />

      {/* Upgrade modal from limit banner */}
      <UpgradeModal
        open={limitUpgradeOpen}
        onOpenChange={setLimitUpgradeOpen}
        featureLabel="Chat IA Ilimitado"
        variant="vip"
      />
    </MainLayout>
  );
}