import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PalpiteSalvo {
  id: string;
  user_id: string;
  dezenas: number[];
  qtd_dezenas: number;
  periodo_analise: number | null;
  loteria: string | null;
  nome: string | null;
  created_at: string;
  concurso_alvo: number | null;
  conferido: boolean;
  acertos: number | null;
}

export function usePalpitesSalvos() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const salvarPalpites = async (
    palpites: { dezenas: number[] }[],
    periodoAnalise?: number
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para salvar palpites.",
          variant: "destructive",
        });
        return false;
      }

      const inserts = palpites.map((p) => ({
        user_id: user.id,
        dezenas: p.dezenas,
        qtd_dezenas: p.dezenas.length,
        periodo_analise: periodoAnalise || null,
        loteria: "lotofacil",
      }));

      const { error } = await supabase
        .from("palpites_salvos")
        .insert(inserts);

      if (error) throw error;

      toast({
        title: "Palpites salvos! 💾",
        description: `${palpites.length} palpite(s) salvo(s) com sucesso.`,
      });
      return true;
    } catch (error) {
      console.error("Erro ao salvar palpites:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar os palpites.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const buscarPalpites = async (): Promise<PalpiteSalvo[]> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("palpites_salvos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as PalpiteSalvo[];
    } catch (error) {
      console.error("Erro ao buscar palpites:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const excluirPalpite = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("palpites_salvos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Palpite excluído",
        description: "Palpite removido com sucesso.",
      });
      return true;
    } catch (error) {
      console.error("Erro ao excluir palpite:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o palpite.",
        variant: "destructive",
      });
      return false;
    }
  };

  const excluirVarios = async (ids: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("palpites_salvos")
        .delete()
        .in("id", ids);

      if (error) throw error;
      
      toast({
        title: "Palpites excluídos",
        description: `${ids.length} palpite(s) removido(s).`,
      });
      return true;
    } catch (error) {
      console.error("Erro ao excluir palpites:", error);
      return false;
    }
  };

  return {
    isLoading,
    salvarPalpites,
    buscarPalpites,
    excluirPalpite,
    excluirVarios,
  };
}
