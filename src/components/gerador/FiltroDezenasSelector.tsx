import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { formatarDezena } from "@/lib/lotofacil";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface FiltroDezenasProps {
  label: string;
  description: string;
  value: "padrao" | "sim" | "nao";
  onChange: (value: "padrao" | "sim" | "nao") => void;
  dezenasSelecionadas: number[];
  onDezenasChange: (dezenas: number[]) => void;
  disabled?: boolean;
  tipo: "fixas" | "excluidas";
}

export function FiltroDezenasSelector({
  label,
  description,
  value,
  onChange,
  dezenasSelecionadas,
  onDezenasChange,
  disabled = false,
  tipo,
}: FiltroDezenasProps) {
  const [seletorAberto, setSeletorAberto] = useState(false);

  const handleDezenaClick = (dezena: number) => {
    if (dezenasSelecionadas.includes(dezena)) {
      onDezenasChange(dezenasSelecionadas.filter((d) => d !== dezena));
    } else {
      // Limite de 10 dezenas para fixas/excluídas
      if (dezenasSelecionadas.length < 10) {
        onDezenasChange([...dezenasSelecionadas, dezena].sort((a, b) => a - b));
      }
    }
  };

  const handleRadioChange = (newValue: string) => {
    onChange(newValue as "padrao" | "sim" | "nao");
    if (newValue === "sim") {
      setSeletorAberto(true);
    } else {
      setSeletorAberto(false);
      if (newValue === "padrao" || newValue === "nao") {
        onDezenasChange([]);
      }
    }
  };

  const limparDezenas = () => {
    onDezenasChange([]);
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={handleRadioChange}
        className="flex gap-4"
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="padrao" id={`${tipo}-padrao`} />
          <Label htmlFor={`${tipo}-padrao`} className="text-sm cursor-pointer">
            Padrão
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sim" id={`${tipo}-sim`} />
          <Label htmlFor={`${tipo}-sim`} className="text-sm cursor-pointer">
            Sim
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="nao" id={`${tipo}-nao`} />
          <Label htmlFor={`${tipo}-nao`} className="text-sm cursor-pointer">
            Não
          </Label>
        </div>
      </RadioGroup>

      {/* Seletor de dezenas */}
      {value === "sim" && (
        <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Selecione até 10 dezenas ({dezenasSelecionadas.length}/10)
            </span>
            {dezenasSelecionadas.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limparDezenas}
                className="h-6 text-xs px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          {/* Grid de dezenas */}
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 25 }, (_, i) => i + 1).map((dezena) => {
              const isSelected = dezenasSelecionadas.includes(dezena);
              return (
                <button
                  key={dezena}
                  type="button"
                  onClick={() => handleDezenaClick(dezena)}
                  disabled={disabled || (!isSelected && dezenasSelecionadas.length >= 10)}
                  className={cn(
                    "h-9 w-full rounded-md text-sm font-bold transition-all",
                    isSelected
                      ? tipo === "fixas"
                        ? "bg-palpite-fixa text-palpite-fixa-foreground"
                        : "bg-destructive text-destructive-foreground"
                      : "bg-card border border-border hover:border-primary/50",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {formatarDezena(dezena)}
                </button>
              );
            })}
          </div>

          {/* Dezenas selecionadas */}
          {dezenasSelecionadas.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2 border-t border-border/50">
              {dezenasSelecionadas.map((d) => (
                <span
                  key={d}
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-bold",
                    tipo === "fixas"
                      ? "bg-palpite-fixa text-palpite-fixa-foreground"
                      : "bg-destructive text-destructive-foreground"
                  )}
                >
                  {formatarDezena(d)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
