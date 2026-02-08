import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface JogoCardMegaSenaProps {
  index: number;
  dezenas: number[];
  dezenasFixes?: number[];
  isSelected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  acertos?: number | null;
  showCheckbox?: boolean;
  compact?: boolean;
}

export function JogoCardMegaSena({
  index,
  dezenas,
  dezenasFixes = [],
  isSelected = false,
  onSelectChange,
  acertos,
  showCheckbox = true,
  compact = false,
}: JogoCardMegaSenaProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const formatDezena = (n: number) => n.toString().padStart(2, "0");

  const handleCopy = async () => {
    const texto = dezenas.map(formatDezena).join(" - ");
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      toast({
        title: `Jogo ${index + 1} copiado!`,
        description: texto,
      });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({
        title: "Erro ao copiar",
        variant: "destructive",
      });
    }
  };

  const getAcertosStyle = () => {
    if (acertos === null || acertos === undefined) return "";
    if (acertos >= 6) return "ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-950/30";
    if (acertos >= 5) return "ring-2 ring-emerald-400 bg-emerald-50 dark:bg-emerald-950/30";
    if (acertos >= 4) return "ring-1 ring-blue-400 bg-blue-50 dark:bg-blue-950/30";
    return "";
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 p-2 rounded-lg border bg-card transition-all",
        getAcertosStyle(),
        isSelected && "border-megasena-primary/50 bg-megasena-primary/5"
      )}
    >
      {/* Linha superior: checkbox, número do jogo, acertos, copiar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {showCheckbox && onSelectChange && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelectChange}
              className="shrink-0"
            />
          )}
          <span className="text-xs text-muted-foreground font-medium">
            Jogo #{index + 1}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          {acertos !== null && acertos !== undefined && (
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full shrink-0",
                acertos >= 6 && "bg-amber-500 text-white",
                acertos === 5 && "bg-emerald-500 text-white",
                acertos === 4 && "bg-blue-500 text-white",
                acertos < 4 && "bg-muted text-muted-foreground"
              )}
            >
              {acertos}pt
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-7 w-7 shrink-0"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-megasena-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Dezenas em linha */}
      <div className="flex items-center gap-1">
        {dezenas.map((dezena) => {
          const isFixa = dezenasFixes.includes(dezena);
          return (
            <span
              key={dezena}
              className={cn(
                "inline-flex items-center justify-center font-bold transition-all",
                "w-6 h-6 text-[10px] rounded-full",
                isFixa
                  ? "bg-palpite-fixa text-palpite-fixa-foreground"
                  : "bg-megasena-primary text-megasena-primary-foreground"
              )}
            >
              {formatDezena(dezena)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
