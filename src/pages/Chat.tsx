import { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format, isSameDay, parseISO } from "date-fns";
import { ArrowLeft, Send, Sparkles } from "lucide-react";

export default function Chat() {
  const isMobile = useIsMobile();
  const { profile } = useAuthContext();
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

  const chatHeaderContent = selectedTopic ? (
    <div className="flex items-center gap-2">
      <ChatAvatar />
      <div className="min-w-0 leading-tight">
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
  ) : undefined;

  return (
    <MainLayout
      pageTitle={selectedTopic ? "" : "Chat"}
      onBack={selectedTopic ? goBack : undefined}
    >
      <div className="flex h-[calc(100dvh-5rem)] flex-col overflow-hidden md:h-full" style={{ background: "#F8F9FA" }}>
        {/* Desktop-only header when no topic selected */}
        {!selectedTopic && !isMobile ? (
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
                      const isUser = m.role === "user";
                      const showUserAvatar =
                        isUser && (!prev || prev.role !== "user" || showDaySeparator);
                      const isAssistant = !isUser;
                      const showBotAvatar =
                        isAssistant && (!prev || prev.role !== "assistant" || showDaySeparator);

                      const userInitials = profile?.nome
                        ? profile.nome.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
                        : "EU";

                      return (
                        <div key={m.id} className="space-y-2">
                          {showDaySeparator ? (
                            <ChatDaySeparator date={m.created_at} />
                          ) : null}

                          {isAssistant ? (
                            <div className="flex items-end gap-2">
                              {showBotAvatar ? <ChatAvatar /> : <div className="h-9 w-9" />}
                              <ChatMessageBubble
                                role="assistant"
                                content={m.content}
                                timeLabel={timeLabel}
                                actions={m.actions}
                              />
                            </div>
                          ) : (
                            <div className="flex items-end justify-end gap-2">
                              <ChatMessageBubble role="user" content={m.content} timeLabel={timeLabel} />
                              {showUserAvatar ? (
                                <Avatar className="h-9 w-9 shrink-0 shadow-sm">
                                  <AvatarImage src={profile?.avatar_url || undefined} />
                                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                                    {userInitials}
                                  </AvatarFallback>
                                </Avatar>
                              ) : <div className="h-9 w-9 shrink-0" />}
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
            <div
              className="fixed left-0 right-0 z-50 px-4 py-3 text-center animate-fade-in bottom-[calc(env(safe-area-inset-bottom)+4rem+3.5rem)] md:bottom-[3.5rem]"
              style={{
                background: "linear-gradient(135deg, rgba(109,40,217,0.08), rgba(139,92,246,0.12))",
                borderTop: "1px solid rgba(139,92,246,0.2)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <p className="text-xs text-[hsl(270,50%,50%)] mb-2.5">
                ✨ {usage?.limit ?? 3}/{usage?.limit ?? 3} mensagens usadas hoje
              </p>
              <button
                type="button"
                onClick={() => setLimitUpgradeOpen(true)}
                className="w-full h-10 rounded-xl text-white text-sm font-semibold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(270,70%,50%)] shadow-[0_4px_16px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)] active:scale-[0.98] transition-all duration-150 relative overflow-hidden"
              >
                <span className="relative z-10">👑 Desbloquear acesso ilimitado</span>
                <span
                  className="absolute inset-0 z-0"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                    animation: "shimmer 2s infinite",
                  }}
                />
              </button>
            </div>
          )}

          {/* Composer */}
          <div
            className={cn(
              "fixed left-0 right-0 z-50 px-3",
              "bottom-[calc(env(safe-area-inset-bottom)+4rem)]",
              "md:bottom-0"
            )}
            style={{
              paddingTop: "0.5rem",
              paddingBottom: "0.75rem",
              background: "linear-gradient(to top, hsla(0,0%,97.6%,0.92) 60%, hsla(0,0%,97.6%,0))",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <div className="mx-auto flex max-w-3xl items-center gap-2.5 md:max-w-4xl">
              <input
                className={cn(
                  "flex-1 h-12 rounded-full border px-5 text-sm outline-none transition-all duration-300",
                  limitReached
                    ? "bg-muted/60 border-border text-muted-foreground placeholder:italic placeholder:opacity-50 cursor-not-allowed"
                    : "bg-white border-[#E5E7EB] text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/10",
                  (!selectedTopic || sending) && !limitReached && "disabled:opacity-50"
                )}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={
                  limitReached
                    ? "Limite diário atingido"
                    : selectedTopic
                      ? "Mensagem..."
                      : "Escolha uma loteria acima"
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                disabled={sending || !selectedTopic || limitReached}
              />

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !draft.trim() || !selectedTopic || limitReached}
                aria-label="Enviar"
                className={cn(
                  "shrink-0 flex items-center justify-center h-12 w-12 rounded-full text-white transition-all duration-150",
                  "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(270,70%,50%)]",
                  limitReached
                    ? "opacity-30 shadow-none cursor-not-allowed"
                    : sending || !draft.trim() || !selectedTopic
                      ? "opacity-40 shadow-none"
                      : "opacity-100 shadow-[0_4px_16px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)] active:scale-95"
                )}
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            {/* Last message warning — below composer */}
            {selectedTopic && remaining === 1 && !limitReached && (
              <p className="text-center text-xs text-amber-600/80 mt-1.5 animate-fade-in">
                ⚠️ Última mensagem gratuita de hoje
              </p>
            )}
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