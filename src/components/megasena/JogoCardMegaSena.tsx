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
        "flex items-center gap-2 p-2 rounded-lg border bg-card transition-all",
        getAcertosStyle(),
        isSelected && "border-megasena-primary/50 bg-megasena-primary/5"
      )}
    >
      {/* Checkbox */}
      {showCheckbox && onSelectChange && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectChange}
          className="shrink-0"
        />
      )}

      {/* Número do jogo */}
      <span className="text-xs text-muted-foreground font-medium min-w-[2rem]">
        #{index + 1}
      </span>

      {/* Dezenas em linha */}
      <div className="flex items-center gap-1 flex-1">
        {dezenas.map((dezena) => {
          const isFixa = dezenasFixes.includes(dezena);
          return (
            <span
              key={dezena}
              className={cn(
                "inline-flex items-center justify-center font-bold transition-all",
                compact 
                  ? "w-7 h-7 text-xs rounded-full" 
                  : "w-8 h-8 text-sm rounded-full",
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

      {/* Acertos badge */}
      {acertos !== null && acertos !== undefined && (
        <span
          className={cn(
            "text-xs font-bold px-2 py-1 rounded-full shrink-0",
            acertos >= 6 && "bg-amber-500 text-white",
            acertos === 5 && "bg-emerald-500 text-white",
            acertos === 4 && "bg-blue-500 text-white",
            acertos < 4 && "bg-muted text-muted-foreground"
          )}
        >
          {acertos}pt
        </span>
      )}

      {/* Botão copiar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        className="h-8 w-8 shrink-0"
      >
        {copied ? (
          <Check className="h-4 w-4 text-megasena-primary" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
