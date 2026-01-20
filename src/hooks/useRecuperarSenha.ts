import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RecuperarSenhaState {
  userId: string | null;
  metodo: "sms" | "email" | null;
  destinoMascarado: string;
}

interface UseRecuperarSenhaReturn {
  state: RecuperarSenhaState;
  isLoading: boolean;
  error: string | null;
  cooldown: number;
  buscarUsuario: (identificador: string) => Promise<{ sucesso: boolean; erro?: string }>;
  verificarCodigo: (codigo: string) => Promise<{ sucesso: boolean; erro?: string }>;
  redefinirSenha: (codigo: string, novaSenha: string) => Promise<{ sucesso: boolean; erro?: string }>;
  reenviarCodigo: () => Promise<{ sucesso: boolean; erro?: string }>;
  resetError: () => void;
  resetState: () => void;
}

export function useRecuperarSenha(): UseRecuperarSenhaReturn {
  const [state, setState] = useState<RecuperarSenhaState>({
    userId: null,
    metodo: null,
    destinoMascarado: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [identificadorSalvo, setIdentificadorSalvo] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const buscarUsuario = async (identificador: string): Promise<{ sucesso: boolean; erro?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("recuperar-senha", {
        body: { identificador },
      });

      if (fnError) {
        const erro = "Erro ao processar solicitação";
        setError(erro);
        return { sucesso: false, erro };
      }

      if (!data.sucesso && data.erro) {
        setError(data.erro);
        return { sucesso: false, erro: data.erro };
      }

      // Caso genérico (usuário não encontrado, mas não revelamos)
      if (data.mensagem && !data.user_id) {
        setError("Usuário não encontrado. Verifique o email ou celular.");
        return { sucesso: false, erro: "Usuário não encontrado" };
      }

      setIdentificadorSalvo(identificador);
      setState({
        userId: data.user_id,
        metodo: data.metodo,
        destinoMascarado: data.destino_mascarado,
      });
      setCooldown(60);

      return { sucesso: true };
    } catch (err: any) {
      const erro = err.message || "Erro ao buscar usuário";
      setError(erro);
      return { sucesso: false, erro };
    } finally {
      setIsLoading(false);
    }
  };

  const verificarCodigo = async (codigo: string): Promise<{ sucesso: boolean; erro?: string }> => {
    if (!state.userId) {
      return { sucesso: false, erro: "Usuário não identificado" };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verificar-codigo", {
        body: { user_id: state.userId, codigo },
      });

      if (fnError) {
        const erro = "Erro ao verificar código";
        setError(erro);
        return { sucesso: false, erro };
      }

      if (!data.sucesso) {
        setError(data.erro);
        return { sucesso: false, erro: data.erro };
      }

      return { sucesso: true };
    } catch (err: any) {
      const erro = err.message || "Erro ao verificar código";
      setError(erro);
      return { sucesso: false, erro };
    } finally {
      setIsLoading(false);
    }
  };

  const redefinirSenha = async (codigo: string, novaSenha: string): Promise<{ sucesso: boolean; erro?: string }> => {
    if (!state.userId) {
      return { sucesso: false, erro: "Usuário não identificado" };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("redefinir-senha", {
        body: { user_id: state.userId, codigo, nova_senha: novaSenha },
      });

      if (fnError) {
        const erro = "Erro ao redefinir senha";
        setError(erro);
        return { sucesso: false, erro };
      }

      if (!data.sucesso) {
        setError(data.erro);
        return { sucesso: false, erro: data.erro };
      }

      return { sucesso: true };
    } catch (err: any) {
      const erro = err.message || "Erro ao redefinir senha";
      setError(erro);
      return { sucesso: false, erro };
    } finally {
      setIsLoading(false);
    }
  };

  const reenviarCodigo = async (): Promise<{ sucesso: boolean; erro?: string }> => {
    if (!identificadorSalvo) {
      return { sucesso: false, erro: "Identificador não disponível" };
    }

    if (cooldown > 0) {
      return { sucesso: false, erro: `Aguarde ${cooldown}s` };
    }

    return buscarUsuario(identificadorSalvo);
  };

  const resetError = () => setError(null);

  const resetState = () => {
    setState({ userId: null, metodo: null, destinoMascarado: "" });
    setError(null);
    setCooldown(0);
    setIdentificadorSalvo("");
  };

  return {
    state,
    isLoading,
    error,
    cooldown,
    buscarUsuario,
    verificarCodigo,
    redefinirSenha,
    reenviarCodigo,
    resetError,
    resetState,
  };
}
