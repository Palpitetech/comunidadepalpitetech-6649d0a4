import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface PatternOption {
  valor: number;
  ocorrencias: number;
  ranking?: number;
}

interface FiltroPatternSelectorProps {
  label: string;
  opcoes: PatternOption[];
  valoresSelecionados: number[];
  onChange: (valores: number[]) => void;
  autoTop3: number[];
  disabled?: boolean;
  onDisabledChange?: (disabled: boolean) => void;
  subtexto?: string;
}

export function FiltroPatternSelector({
  label,
  opcoes,
  valoresSelecionados,
  onChange,
  autoTop3,
  disabled = false,
  onDisabledChange,
  subtexto,
}: FiltroPatternSelectorProps) {
  const valoresAtivos = valoresSelecionados.length > 0 ? valoresSelecionados : autoTop3;
  
  // Ordenar opções por ocorrência (ranking)
  const opcoesOrdenadas = [...opcoes].sort((a, b) => b.ocorrencias - a.ocorrencias);

  const handleToggleValor = (valor: number) => {
    if (valoresAtivos.includes(valor)) {
      // Não permite desmarcar se for o último
      if (valoresAtivos.length > 1) {
        onChange(valoresAtivos.filter(v => v !== valor));
      }
    } else {
      onChange([...valoresAtivos, valor].sort((a, b) => a - b));
    }
  };

  const handleSelectAll = () => {
    onChange(opcoes.map(o => o.valor).sort((a, b) => a - b));
  };

  const handleSelectRef = () => {
    onChange(autoTop3);
  };

  // Texto do botão dropdown
  const getDropdownLabel = () => {
    if (valoresAtivos.length === opcoes.length) return "Todos";
    if (valoresAtivos.length === autoTop3.length && 
        autoTop3.every(v => valoresAtivos.includes(v)) &&
        valoresAtivos.every(v => autoTop3.includes(v))) {
      return "Ref.";
    }
    return valoresAtivos.length > 3 
      ? `${valoresAtivos.length} sel.`
      : valoresAtivos.join(", ");
  };

  // Formatar referência como range
  const refRange = autoTop3.length > 0 
    ? `${Math.min(...autoTop3)}-${Math.max(...autoTop3)}`
    : "";

  return (
    <div className={cn(
      "py-4 border-b last:border-b-0 transition-opacity",
      disabled && "opacity-50"
    )}>
      <div className="flex items-center justify-between gap-3">
        {/* Lado esquerdo: Label e Ref */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-base">{label}</div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs font-normal px-2 py-0.5">
              Ref: {refRange}
            </Badge>
          </div>
          {subtexto && (
            <div className="text-xs text-primary mt-1">{subtexto}</div>
          )}
        </div>

        {/* Lado direito: Switch + Dropdown */}
        <div className="flex items-center gap-3">
          {onDisabledChange && (
            <Switch
              checked={!disabled}
              onCheckedChange={(checked) => onDisabledChange(checked)}
            />
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
              <Button
                variant="outline"
                className={cn(
                  "min-w-[100px] justify-between gap-2 h-10",
                  disabled && "pointer-events-none"
                )}
              >
                <span>{getDropdownLabel()}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-popover border shadow-lg z-50 p-2"
            >
              {/* Ações rápidas */}
              <div className="flex gap-2 mb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs h-8"
                  onClick={handleSelectAll}
                >
                  Todos
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-xs h-8"
                  onClick={handleSelectRef}
                >
                  Ref.
                </Button>
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
                      {isTop3 && (
                        <span className="text-[10px] text-primary">Ref</span>
                      )}
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        index < 3 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {opt.ocorrencias}x
                      </span>
                    </button>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
