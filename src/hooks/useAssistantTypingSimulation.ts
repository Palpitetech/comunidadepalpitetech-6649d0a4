import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@/hooks/useChat";

type UseAssistantTypingSimulationArgs = {
  enabled: boolean;
  messages: ChatMessage[];
  prefersReducedMotion: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Simula o tempo de "digitando..." antes de exibir a última mensagem do assistente.
 * 
 * Referência: ~4 caracteres/segundo (≈ 250ms por caractere).
 * 10 caracteres ≈ 2,5s.
 */
function computeTypingDelayMs(text: string, prefersReducedMotion: boolean) {
  const len = text.trim().length;

  // Para "reduzir movimento", diminuímos a espera total (menos tempo "em suspense").
  const perCharMs = prefersReducedMotion ? 120 : 250;
  const baseMs = prefersReducedMotion ? 150 : 400;
  const minMs = prefersReducedMotion ? 250 : 900;
  const maxMs = prefersReducedMotion ? 2500 : 9000;

  return clamp(baseMs + len * perCharMs, minMs, maxMs);
}

export function useAssistantTypingSimulation({
  enabled,
  messages,
  prefersReducedMotion,
}: UseAssistantTypingSimulationArgs) {
  const [uiMessages, setUiMessages] = useState<ChatMessage[]>([]);
  const [isSimulatingTyping, setIsSimulatingTyping] = useState(false);
  const uiMessagesRef = useRef<ChatMessage[]>([]);
  const pendingAssistantIdRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const last = useMemo(() => messages[messages.length - 1], [messages]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    uiMessagesRef.current = uiMessages;
  }, [uiMessages]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      pendingAssistantIdRef.current = null;
      setIsSimulatingTyping(false);
      setUiMessages([]);
      return;
    }

    // Sem mensagens: reset
    if (messages.length === 0) {
      pendingAssistantIdRef.current = null;
      setIsSimulatingTyping(false);
      setUiMessages([]);
      return;
    }

    // Caso comum: última mensagem não é do assistente.
    // Mantemos UI sincronizada (sem simulação) *a menos* que já estejamos simulando.
    if (!last || last.role !== "assistant") {
      // Se não há mensagem pendente, sincroniza.
      if (!pendingAssistantIdRef.current) setUiMessages(messages);
      return;
    }

    // Se já está exibida, apenas sincroniza.
    const alreadyVisible = uiMessagesRef.current.some((m) => m.id === last.id);
    if (alreadyVisible) {
      pendingAssistantIdRef.current = null;
      setIsSimulatingTyping(false);
      setUiMessages(messages);
      return;
    }

    // Nova mensagem do assistente chegou: segura a exibição e simula digitação.
    if (timerRef.current) window.clearTimeout(timerRef.current);

    pendingAssistantIdRef.current = last.id;
    setIsSimulatingTyping(true);
    setUiMessages(messages.slice(0, -1));

    const delay = computeTypingDelayMs(last.content ?? "", prefersReducedMotion);
    timerRef.current = window.setTimeout(() => {
      // Exibe o histórico completo mais recente.
      setUiMessages((prev) => {
        // Se por algum motivo a lista já contém o id, evita duplicar.
        if (prev.some((m) => m.id === last.id)) return prev;
        return [...prev, last];
      });

      pendingAssistantIdRef.current = null;
      setIsSimulatingTyping(false);
      timerRef.current = null;
    }, delay);
  }, [enabled, last, messages, prefersReducedMotion]);

  return { uiMessages, isSimulatingTyping };
}
