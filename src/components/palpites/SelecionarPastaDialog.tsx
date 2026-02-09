import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Folder, Plus } from "lucide-react";
import { type Pasta } from "./PastaItem";

interface SelecionarPastaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pastas: Pasta[];
  onSelect: (pastaId: string | null) => void;
  onNovaPasta: () => void;
  loteria: string;
  isLoading?: boolean;
}

const LOTTERY_LABELS: Record<string, string> = {
  lotofacil: "Lotofácil",
  megasena: "Mega Sena",
  duplasena: "Dupla Sena",
};

export function SelecionarPastaDialog({
  open,
  onOpenChange,
  pastas,
  onSelect,
  onNovaPasta,
  loteria,
  isLoading,
}: SelecionarPastaDialogProps) {
  const loteriaLabel = LOTTERY_LABELS[loteria] || loteria;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Salvar em qual pasta? ({loteriaLabel})</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-4 max-h-[300px] overflow-y-auto">
          {/* Sem pasta */}
          <button
            onClick={() => onSelect(null)}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
          >
            <Folder className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">Sem pasta</span>
          </button>

          {/* Lista de pastas */}
          {pastas.map((pasta) => (
            <button
              key={pasta.id}
              onClick={() => onSelect(pasta.id)}
              disabled={isLoading}
              className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
            >
              <Folder className="h-5 w-5" style={{ color: pasta.cor }} />
              <span className="text-sm font-medium">{pasta.nome}</span>
            </button>
          ))}

          {/* Nova pasta */}
          <button
            onClick={onNovaPasta}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed hover:bg-muted/50 transition-colors text-left text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-5 w-5" />
            <span className="text-sm">Criar nova pasta</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
