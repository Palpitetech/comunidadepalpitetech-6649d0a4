import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CHAT_TOPICS, type ChatTopicId } from "@/lib/chatTopics";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

export default function Chat() {
  const [selectedTopic, setSelectedTopic] = useState<ChatTopicId | null>(null);
  const topicMeta = useMemo(
    () => (selectedTopic ? CHAT_TOPICS.find((t) => t.id === selectedTopic) : undefined),
    [selectedTopic]
  );

  const { messages, loading, sending, error, remainingToday, sendMessage } = useChat({
    topic: selectedTopic,
  });

  const [draft, setDraft] = useState("");

  const handlePickTopic = async (id: ChatTopicId) => {
    setSelectedTopic(id);
    setDraft("");
  };

  const handleSend = async () => {
    if (!selectedTopic) return;
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await sendMessage(text);
  };

  return (
    <MainLayout>
      <div className="container-senior pt-4 pb-8 space-y-6">
        <header className="space-y-1">
          <h1 className="text-senior-xl font-semibold">Chat</h1>
          <p className="text-muted-foreground">
            Escolha um tema para começarmos — você sempre verá todas as opções.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CHAT_TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handlePickTopic(t.id)}
              className={cn("text-left", selectedTopic === t.id && "ring-2 ring-primary rounded-lg")}
            >
              <Card className="h-full hover:border-primary transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-senior-lg">{t.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t.description}</p>
                </CardContent>
              </Card>
            </button>
          ))}
        </section>

        <Separator />

        <section className="space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-senior-lg font-semibold">
                {topicMeta ? topicMeta.title : "Selecione um tema acima"}
              </h2>
              {selectedTopic === "estatisticas" && remainingToday !== null && (
                <p className="text-sm text-muted-foreground">
                  Mensagens restantes hoje (estatísticas): <strong>{remainingToday}</strong>
                </p>
              )}
            </div>
            {selectedTopic && (
              <Button variant="outline" onClick={() => setSelectedTopic(null)}>
                Trocar tema
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              {!selectedTopic ? (
                <p className="text-muted-foreground">
                  Escolha uma das opções acima para abrir a conversa.
                </p>
              ) : loading ? (
                <p className="text-muted-foreground">Carregando conversa...</p>
              ) : (
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-muted-foreground">
                      Sem mensagens ainda. Escreva sua primeira pergunta.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={cn(
                            "max-w-[92%] rounded-lg border px-4 py-3 text-sm leading-relaxed",
                            m.role === "user"
                              ? "ml-auto bg-muted/40"
                              : "mr-auto bg-card"
                          )}
                        >
                          {m.content}
                        </div>
                      ))}
                    </div>
                  )}

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="flex gap-2">
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      disabled={sending}
                    />
                    <Button onClick={() => void handleSend()} disabled={sending || !draft.trim()}>
                      {sending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}
