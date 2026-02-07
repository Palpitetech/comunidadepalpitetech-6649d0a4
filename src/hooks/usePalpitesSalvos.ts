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
  pasta_id: string | null;
  estrategia: string | null;
}

export interface PalpitePasta {
  id: string;
  user_id: string;
  nome: string;
  cor: string;
  created_at: string;
  updated_at: string;
}

export function usePalpitesSalvos() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const salvarPalpites = async (
    palpites: { dezenas: number[] }[],
    periodoAnalise?: number,
    pastaId?: string | null,
    estrategia?: string
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
        pasta_id: pastaId || null,
        estrategia: estrategia || null,
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

  // ========== PASTAS ==========
  
  const buscarPastas = async (): Promise<PalpitePasta[]> => {
    try {
      const { data, error } = await supabase
        .from("palpites_pastas")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      return (data || []) as PalpitePasta[];
    } catch (error) {
      console.error("Erro ao buscar pastas:", error);
      return [];
    }
  };

  const criarPasta = async (nome: string, cor: string): Promise<PalpitePasta | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("palpites_pastas")
        .insert({ user_id: user.id, nome, cor })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Pasta criada! 📁",
        description: `Pasta "${nome}" criada com sucesso.`,
      });
      return data as PalpitePasta;
    } catch (error) {
      console.error("Erro ao criar pasta:", error);
      toast({
        title: "Erro ao criar pasta",
        variant: "destructive",
      });
      return null;
    }
  };

  const renomearPasta = async (id: string, nome: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("palpites_pastas")
        .update({ nome })
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Erro ao renomear pasta:", error);
      return false;
    }
  };

  const excluirPasta = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("palpites_pastas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Pasta excluída",
        description: "A pasta foi removida. Os palpites foram mantidos.",
      });
      return true;
    } catch (error) {
      console.error("Erro ao excluir pasta:", error);
      return false;
    }
  };

  const moverParaPasta = async (palpiteIds: string[], pastaId: string | null): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("palpites_salvos")
        .update({ pasta_id: pastaId })
        .in("id", palpiteIds);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Erro ao mover palpites:", error);
      return false;
    }
  };

  return {
    isLoading,
    salvarPalpites,
    buscarPalpites,
    excluirPalpite,
    excluirVarios,
    buscarPastas,
    criarPasta,
    renomearPasta,
    excluirPasta,
    moverParaPasta,
  };
}
