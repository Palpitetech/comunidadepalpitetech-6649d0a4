import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CORES_PASTA = [
  "#8b5cf6", // roxo
  "#ef4444", // vermelho
  "#f59e0b", // laranja
  "#22c55e", // verde
  "#3b82f6", // azul
  "#ec4899", // rosa
  "#06b6d4", // ciano
  "#6b7280", // cinza
];

const LOTTERY_CONFIG: Record<string, { nome: string; cor: string; icone: string }> = {
  lotofacil: { nome: "Lotofácil", cor: "#8b5cf6", icone: "🍀" },
  megasena: { nome: "Mega Sena", cor: "#22c55e", icone: "🎱" },
  duplasena: { nome: "Dupla Sena", cor: "#f97316", icone: "🎯" },
};

interface Subpasta {
  id: string;
  nome: string;
  cor: string;
}

interface SelecionarSubpastaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (pastaId: string) => void;
  loteria: string;
  isLoading?: boolean;
}

export function SelecionarSubpastaDialog({
  open,
  onOpenChange,
  onSelect,
  loteria,
  isLoading,
}: SelecionarSubpastaDialogProps) {
  const [subpastas, setSubpastas] = useState<Subpasta[]>([]);
  const [loading, setLoading] = useState(false);
  const [criandoPasta, setCriandoPasta] = useState(false);
  const [novaPastaNome, setNovaPastaNome] = useState("");
  const [novaPastaCor, setNovaPastaCor] = useState(CORES_PASTA[0]);
  const [pastaRaizId, setPastaRaizId] = useState<string | null>(null);

  const loteriaConfig = LOTTERY_CONFIG[loteria] || { nome: loteria, cor: "#8b5cf6", icone: "📁" };

  // Carregar subpastas quando abrir
  useEffect(() => {
    if (open) {
      loadSubpastas();
    }
  }, [open, loteria]);

  const loadSubpastas = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar ou criar pasta raiz da loteria
      let raiz = await buscarOuCriarPastaRaiz(user.id);
      if (!raiz) return;

      setPastaRaizId(raiz.id);

      // Buscar subpastas
      const { data } = await supabase
        .from("palpites_pastas")
        .select("id, nome, cor")
        .eq("user_id", user.id)
        .eq("parent_id", raiz.id)
        .order("nome");

      setSubpastas(data || []);
    } catch (error) {
      console.error("Erro ao carregar subpastas:", error);
    } finally {
      setLoading(false);
    }
  };

  const buscarOuCriarPastaRaiz = async (userId: string) => {
    // Buscar pasta raiz existente
    const { data: existing } = await supabase
      .from("palpites_pastas")
      .select("id")
      .eq("user_id", userId)
      .eq("loteria", loteria)
      .eq("is_root", true)
      .single();

    if (existing) return existing;

    // Criar pasta raiz
    const { data: created } = await supabase
      .from("palpites_pastas")
      .insert({
        user_id: userId,
        nome: loteriaConfig.nome,
        cor: loteriaConfig.cor,
        loteria: loteria,
        is_root: true,
      })
      .select("id")
      .single();

    return created;
  };

  const handleCriarSubpasta = async () => {
    if (!novaPastaNome.trim() || !pastaRaizId) return;
    
    setCriandoPasta(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("palpites_pastas")
        .insert({
          user_id: user.id,
          nome: novaPastaNome.trim(),
          cor: novaPastaCor,
          loteria: loteria,
          parent_id: pastaRaizId,
          is_root: false,
        })
        .select("id, nome, cor")
        .single();

      if (error) throw error;

      if (data) {
        setSubpastas(prev => [...prev, data]);
        setNovaPastaNome("");
        setNovaPastaCor(CORES_PASTA[0]);
        // Selecionar a pasta recém criada
        onSelect(data.id);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Erro ao criar subpasta:", error);
    } finally {
      setCriandoPasta(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{loteriaConfig.icone}</span>
            Salvar em {loteriaConfig.nome}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lista de subpastas existentes */}
            {subpastas.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Pastas existentes
                </Label>
                <div className="max-h-[180px] overflow-y-auto space-y-1">
                  {subpastas.map((pasta) => (
                    <button
                      key={pasta.id}
                      onClick={() => {
                        onSelect(pasta.id);
                        onOpenChange(false);
                      }}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                    >
                      <Folder className="h-5 w-5" style={{ color: pasta.cor }} />
                      <span className="text-sm font-medium truncate">{pasta.nome}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divisor */}
            {subpastas.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            {/* Criar nova subpasta */}
            <div className="space-y-3 p-3 rounded-lg border-2 border-dashed bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Plus className="h-4 w-4" />
                Criar nova pasta
              </div>
              
              <Input
                value={novaPastaNome}
                onChange={(e) => setNovaPastaNome(e.target.value)}
                placeholder="Nome da pasta"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && novaPastaNome.trim()) {
                    handleCriarSubpasta();
                  }
                }}
              />

              <div className="flex flex-wrap gap-2">
                {CORES_PASTA.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setNovaPastaCor(cor)}
                    className={`w-7 h-7 rounded-full transition-all ${
                      novaPastaCor === cor ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>

              <Button
                onClick={handleCriarSubpasta}
                disabled={!novaPastaNome.trim() || criandoPasta}
                className="w-full"
              >
                {criandoPasta ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Criar e Salvar
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
