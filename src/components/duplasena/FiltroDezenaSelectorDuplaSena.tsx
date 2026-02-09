import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
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
  maxDezenas?: number;
}

export function FiltroDezenaSelectorDuplaSena({
  label,
  description,
  value,
  onChange,
  dezenasSelecionadas,
  onDezenasChange,
  disabled = false,
  tipo,
  maxDezenas = 5,
}: FiltroDezenasProps) {
  const [seletorAberto, setSeletorAberto] = useState(false);

  const formatDezena = (n: number) => n.toString().padStart(2, "0");

  const handleDezenaClick = (dezena: number) => {
    if (dezenasSelecionadas.includes(dezena)) {
      onDezenasChange(dezenasSelecionadas.filter((d) => d !== dezena));
    } else {
      if (dezenasSelecionadas.length < maxDezenas) {
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
          <RadioGroupItem value="padrao" id={`duplasena-${tipo}-padrao`} />
          <Label htmlFor={`duplasena-${tipo}-padrao`} className="text-sm cursor-pointer">
            Padrão
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sim" id={`duplasena-${tipo}-sim`} />
          <Label htmlFor={`duplasena-${tipo}-sim`} className="text-sm cursor-pointer">
            Sim
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="nao" id={`duplasena-${tipo}-nao`} />
          <Label htmlFor={`duplasena-${tipo}-nao`} className="text-sm cursor-pointer">
            Não
          </Label>
        </div>
      </RadioGroup>

      {/* Seletor de dezenas - Grid 10x5 para Dupla Sena */}
      {value === "sim" && (
        <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Selecione até {maxDezenas} dezenas ({dezenasSelecionadas.length}/{maxDezenas})
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

          {/* Grid de dezenas 10x5 */}
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 50 }, (_, i) => i + 1).map((dezena) => {
              const isSelected = dezenasSelecionadas.includes(dezena);
              return (
                <button
                  key={dezena}
                  type="button"
                  onClick={() => handleDezenaClick(dezena)}
                  disabled={disabled || (!isSelected && dezenasSelecionadas.length >= maxDezenas)}
                  className={cn(
                    "h-8 w-full rounded text-xs font-bold transition-all",
                    isSelected
                      ? tipo === "fixas"
                        ? "bg-duplasena-primary text-duplasena-primary-foreground"
                        : "bg-destructive text-destructive-foreground"
                      : "bg-card border border-border hover:border-duplasena-primary/50",
                    disabled && "opacity-50 cursor-not-allowed",
                    !isSelected && dezenasSelecionadas.length >= maxDezenas && "opacity-40"
                  )}
                >
                  {formatDezena(dezena)}
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
                      ? "bg-duplasena-primary text-duplasena-primary-foreground"
                      : "bg-destructive text-destructive-foreground"
                  )}
                >
                  {formatDezena(d)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
