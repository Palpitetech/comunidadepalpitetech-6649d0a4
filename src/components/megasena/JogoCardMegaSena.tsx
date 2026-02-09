import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  contarImpares, 
  contarMoldura, 
  contarPrimos, 
  contarMultiplosDe3 
} from "@/lib/megasena";
import { AcertosBadge } from "@/components/shared/AcertosBadge";

interface JogoCardMegaSenaProps {
  index: number;
  dezenas: number[];
  dezenasFixes?: number[];
  isSelected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  acertos?: number | null;
  showCheckbox?: boolean;
  compact?: boolean;
  ultimoConcursoDezenas?: number[];
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
  ultimoConcursoDezenas = [],
}: JogoCardMegaSenaProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const formatDezena = (n: number) => n.toString().padStart(2, "0");

  // Calcular padrões
  const padroes = useMemo(() => {
    const impares = contarImpares(dezenas);
    const moldura = contarMoldura(dezenas);
    const primos = contarPrimos(dezenas);
    const m3 = contarMultiplosDe3(dezenas);
    const repetidas = ultimoConcursoDezenas.length > 0 
      ? dezenas.filter(d => ultimoConcursoDezenas.includes(d)).length 
      : null;
    
    return { impares, moldura, primos, m3, repetidas };
  }, [dezenas, ultimoConcursoDezenas]);

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
            <AcertosBadge acertos={acertos} loteria="megasena" />
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

      {/* Padrões estatísticos */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>Ímp: <strong className="text-foreground">{padroes.impares}</strong></span>
        {padroes.repetidas !== null && (
          <span>Rep: <strong className="text-foreground">{padroes.repetidas}</strong></span>
        )}
        <span>Mol: <strong className="text-foreground">{padroes.moldura}</strong></span>
        <span>Pri: <strong className="text-foreground">{padroes.primos}</strong></span>
        <span>M3: <strong className="text-foreground">{padroes.m3}</strong></span>
      </div>
    </div>
  );
}
