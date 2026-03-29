import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type TipoVerificacao = 'sms' | 'email';

type SendResult = { sucesso: boolean; erro?: string; destino_mascarado?: string };

interface EnviarCodigoParams {
  userId: string;
  tipo: TipoVerificacao;
  destino: string;
  nome?: string;
}

interface UseVerificacaoReturn {
  enviarCodigo: (params: EnviarCodigoParams) => Promise<SendResult>;
  verificarCodigo: (userId: string, codigo: string, tipo?: string) => Promise<{ sucesso: boolean; erro?: string }>;
  isLoading: boolean;
  error: string | null;
  cooldown: number;
  resetError: () => void;
}

const pendingSendRequests = new Map<string, Promise<SendResult>>();
const recentSendRequests = new Map<string, number>();
const RECENT_SEND_WINDOW_MS = 5000;

const maskDestino = (tipo: TipoVerificacao, destino: string) => {
  if (tipo === "email") {
    const [localPart, domain] = destino.split("@");
    if (!localPart || !domain) return destino;
    return `${localPart.slice(0, 2)}***@${domain}`;
  }

  const digits = destino.replace(/\D/g, "");
  if (digits.length < 4) return destino;
  return `(${digits.slice(0, 2)}) *****-${digits.slice(-4)}`;
};

export function useVerificacao(): UseVerificacaoReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const enviarCodigo = useCallback(async ({ userId, tipo, destino, nome }: EnviarCodigoParams) => {
    setIsLoading(true);
    setError(null);

    const dedupeKey = `${userId}:${tipo}:${destino}`;
    const now = Date.now();
    const lastSentAt = recentSendRequests.get(dedupeKey);

    if (pendingSendRequests.has(dedupeKey)) {
      setIsLoading(false);
      return pendingSendRequests.get(dedupeKey)!;
    }

    if (lastSentAt && now - lastSentAt < RECENT_SEND_WINDOW_MS) {
      setCooldown(60);
      setIsLoading(false);
      return { sucesso: true, destino_mascarado: maskDestino(tipo, destino) };
    }

    const requestPromise = (async () => {
      try {
        const functionName = tipo === 'email' ? 'enviar-codigo-email' : 'enviar-codigo-sms';
        const body = tipo === 'email'
          ? { user_id: userId, email: destino, nome }
          : { user_id: userId, celular: destino };

        const { data, error: invokeError } = await supabase.functions.invoke(functionName, { body });

        if (invokeError) {
          const errorMessage = invokeError.message || `Erro ao enviar ${tipo === 'email' ? 'email' : 'SMS'}`;
          setError(errorMessage);
          return { sucesso: false, erro: errorMessage };
        }

        if (data?.sucesso) {
          recentSendRequests.set(dedupeKey, Date.now());
          setCooldown(60);
          return { sucesso: true, destino_mascarado: data.destino_mascarado ?? maskDestino(tipo, destino) };
        }

        const errorMessage = data?.erro || `Erro ao enviar ${tipo === 'email' ? 'email' : 'SMS'}`;
        setError(errorMessage);
        return { sucesso: false, erro: errorMessage };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Erro ao enviar ${tipo === 'email' ? 'email' : 'SMS'}`;
        setError(errorMessage);
        return { sucesso: false, erro: errorMessage };
      } finally {
        pendingSendRequests.delete(dedupeKey);
      }
    })();

    pendingSendRequests.set(dedupeKey, requestPromise);

    try {
      return await requestPromise;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verificarCodigo = useCallback(async (userId: string, codigo: string, tipo?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('verificar-codigo', {
        body: { user_id: userId, codigo, tipo }
      });

      if (invokeError) {
        const errorMessage = invokeError.message || 'Erro ao verificar código';
        setError(errorMessage);
        return { sucesso: false, erro: errorMessage };
      }

      if (data?.sucesso) {
        return { sucesso: true };
      }

      const errorMessage = data?.erro || 'Código inválido';
      setError(errorMessage);
      return { sucesso: false, erro: errorMessage };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar código';
      setError(errorMessage);
      return { sucesso: false, erro: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    enviarCodigo,
    verificarCodigo,
    isLoading,
    error,
    cooldown,
    resetError,
  };
}

