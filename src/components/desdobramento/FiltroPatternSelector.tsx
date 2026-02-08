import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

interface PatternOption {
  valor: number;
  ocorrencias: number;
  ranking?: number;
}

interface FiltroPatternSelectorProps {
  label: string;
  emoji: string;
  opcoes: PatternOption[];
  valoresSelecionados: number[];
  onChange: (valores: number[]) => void;
  autoTop3: number[];
  disabled?: boolean;
  onDisabledChange?: (disabled: boolean) => void;
}

export function FiltroPatternSelector({
  label,
  emoji,
  opcoes,
  valoresSelecionados,
  onChange,
  autoTop3,
  disabled = false,
  onDisabledChange,
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
    if (!modoManual) {
      // Se estava em auto, muda para manual ao clicar
      setModoManual(true);
    }
    
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
  
  // Ordenar opções por ocorrência (ranking)
  const opcoesOrdenadas = [...opcoes].sort((a, b) => b.ocorrencias - a.ocorrencias);

  const resumoTexto = disabled 
    ? "Desativado" 
    : valoresAtivos.length > 3 
      ? `${valoresAtivos.length} valores`
      : valoresAtivos.join(", ");

  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all",
      disabled ? "bg-muted/20 opacity-60" : "bg-card"
    )}>
      {/* Header com label e switch de ativar/desativar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span>{emoji}</span>
          <span>{label}</span>
        </div>
        {onDisabledChange && (
          <Switch
            checked={!disabled}
            onCheckedChange={(checked) => onDisabledChange(!checked)}
            className="scale-75"
          />
        )}
      </div>

      {/* Dropdown de seleção */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full justify-between h-9 text-xs",
              disabled && "pointer-events-none"
            )}
          >
            <span className="flex items-center gap-1.5">
              {!modoManual && !disabled && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  Auto
                </span>
              )}
              <span className={cn(disabled && "text-muted-foreground")}>
                {resumoTexto}
              </span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="start" 
          className="w-56 bg-popover border shadow-lg z-50 p-2"
        >
          {/* Toggle Auto/Manual */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-xs text-muted-foreground">Modo automático (Top 3)</span>
            <Switch
              checked={!modoManual}
              onCheckedChange={(checked) => handleToggleManual(!checked)}
              className="scale-75"
            />
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Lista de opções com checkbox */}
          <div className="max-h-48 overflow-y-auto py-1 space-y-0.5">
            {opcoesOrdenadas.map((opt, index) => {
              const isAtivo = valoresAtivos.includes(opt.valor);
              const isTop3 = autoTop3.includes(opt.valor);
              
              return (
                <button
                  key={opt.valor}
                  type="button"
                  onClick={() => handleToggleValor(opt.valor)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm",
                    "hover:bg-accent transition-colors",
                    isAtivo && "bg-primary/5"
                  )}
                >
                  <Checkbox 
                    checked={isAtivo} 
                    className="pointer-events-none"
                  />
                  <span className="flex-1 text-left font-medium">
                    {opt.valor}
                  </span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    index < 3 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {opt.ocorrencias}x
                  </span>
                  {isTop3 && !modoManual && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
