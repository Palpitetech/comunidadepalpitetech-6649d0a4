import { useState } from "react";
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

const CORES_PASTA = [
  "#8b5cf6", // roxo (padrão)
  "#ef4444", // vermelho
  "#f59e0b", // laranja
  "#22c55e", // verde
  "#3b82f6", // azul
  "#ec4899", // rosa
  "#06b6d4", // ciano
  "#6b7280", // cinza
];

interface NovaPastaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (nome: string, cor: string, loteria: string) => void;
  loteria: string;
  isLoading?: boolean;
}

export function NovaPastaDialog({
  open,
  onOpenChange,
  onConfirm,
  loteria,
  isLoading,
}: NovaPastaDialogProps) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(CORES_PASTA[0]);

  const handleConfirm = () => {
    if (nome.trim()) {
      onConfirm(nome.trim(), cor, loteria);
      setNome("");
      setCor(CORES_PASTA[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Nova Pasta</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome-pasta">Nome da pasta</Label>
            <Input
              id="nome-pasta"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Palpites de Fevereiro"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && nome.trim()) handleConfirm();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {CORES_PASTA.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    cor === c ? "ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!nome.trim() || isLoading}>
            Criar Pasta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
