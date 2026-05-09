import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SlideMeta {
  titulo: string;
  resumoDados: string;
}

export function useMega30AulaDescricao(aulaId: string, aulaTitulo: string, slides: SlideMeta[]) {
  const [descricao, setDescricao] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const carregar = useCallback(
    async (force = false) => {
      if (!aulaId || slides.length === 0) return;
      setLoading(true);
      setErro(null);
      try {
        const { data, error } = await supabase.functions.invoke("mega30-descricao-youtube", {
          body: { aula_id: aulaId, aula_titulo: aulaTitulo, slides, force },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setDescricao(data?.descricao ?? "");
        setGeneratedAt(data?.generated_at ?? new Date().toISOString());
      } catch (e: any) {
        setErro(e?.message ?? "Falha ao gerar descrição");
      } finally {
        setLoading(false);
      }
    },
    [aulaId, aulaTitulo, JSON.stringify(slides)],
  );

  useEffect(() => {
    carregar(false);
  }, [carregar]);

  return { descricao, loading, erro, generatedAt, regenerar: () => carregar(true) };
}
