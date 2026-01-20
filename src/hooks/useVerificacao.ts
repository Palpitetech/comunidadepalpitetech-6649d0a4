import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type TipoVerificacao = 'sms' | 'email';

interface EnviarCodigoParams {
  userId: string;
  tipo: TipoVerificacao;
  destino: string;
  nome?: string;
}

interface UseVerificacaoReturn {
  enviarCodigo: (params: EnviarCodigoParams) => Promise<{ sucesso: boolean; erro?: string; destino_mascarado?: string }>;
  verificarCodigo: (userId: string, codigo: string) => Promise<{ sucesso: boolean; erro?: string }>;
  isLoading: boolean;
  error: string | null;
  cooldown: number;
  resetError: () => void;
}

export function useVerificacao(): UseVerificacaoReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Timer para cooldown
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
        setCooldown(60); // 60 segundos até poder reenviar
        return { sucesso: true, destino_mascarado: data.destino_mascarado };
      }

      const errorMessage = data?.erro || `Erro ao enviar ${tipo === 'email' ? 'email' : 'SMS'}`;
      setError(errorMessage);
      return { sucesso: false, erro: errorMessage };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erro ao enviar ${tipo === 'email' ? 'email' : 'SMS'}`;
      setError(errorMessage);
      return { sucesso: false, erro: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verificarCodigo = useCallback(async (userId: string, codigo: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('verificar-codigo', {
        body: { user_id: userId, codigo }
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
