import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface PatternOption {
  valor: number;
  ocorrencias: number;
}

interface FiltroPatternSelectorProps {
  label: string;
  emoji: string;
  opcoes: PatternOption[];
  valoresSelecionados: number[];
  onChange: (valores: number[]) => void;
  autoTop3: number[];
}

export function FiltroPatternSelector({
  label,
  emoji,
  opcoes,
  valoresSelecionados,
  onChange,
  autoTop3,
}: FiltroPatternSelectorProps) {
  const [modoManual, setModoManual] = useState(false);

  const handleToggleManual = (checked: boolean) => {
    setModoManual(checked);
    if (!checked) {
      // Volta para automático - usa top 3
      onChange(autoTop3);
    }
  };

  const handleToggleValor = (valor: number) => {
    if (!modoManual) return;
    
    if (valoresSelecionados.includes(valor)) {
      // Não permite desmarcar se for o último
      if (valoresSelecionados.length > 1) {
        onChange(valoresSelecionados.filter(v => v !== valor));
      }
    } else {
      onChange([...valoresSelecionados, valor].sort((a, b) => a - b));
    }
  };

  const valoresAtivos = modoManual ? valoresSelecionados : autoTop3;

  return (
    <div className="p-3 bg-muted/30 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {emoji} {label}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {modoManual ? "Manual" : "Auto"}
          </span>
          <Switch
            checked={modoManual}
            onCheckedChange={handleToggleManual}
            className="scale-75"
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {opcoes.map((opt) => {
          const isAtivo = valoresAtivos.includes(opt.valor);
          const isTop3 = autoTop3.includes(opt.valor);
          
          return (
            <button
              key={opt.valor}
              type="button"
              onClick={() => handleToggleValor(opt.valor)}
              disabled={!modoManual}
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium transition-all",
                "border",
                isAtivo
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border",
                modoManual && "cursor-pointer hover:border-primary/50",
                !modoManual && "cursor-default opacity-80",
                !modoManual && isTop3 && "ring-1 ring-primary/30"
              )}
            >
              {opt.valor}
            </button>
          );
        })}
      </div>
    </div>
  );
}
