import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface OpcaoPattern {
  valor: number;
  label: string;
  porcentagem?: number;
}

interface FiltroPatternSelectorProps {
  label: string;
  opcoes: OpcaoPattern[];
  valoresSelecionados: number[];
  onChange: (valores: number[]) => void;
  autoTop3?: number[];
  disabled: boolean;
  onDisabledChange: (ativo: boolean) => void;
}

export function FiltroPatternSelector({
  label,
  opcoes,
  valoresSelecionados,
  onChange,
  autoTop3,
  disabled,
  onDisabledChange,
}: FiltroPatternSelectorProps) {
  const toggleValor = (valor: number) => {
    if (valoresSelecionados.includes(valor)) {
      onChange(valoresSelecionados.filter((v) => v !== valor));
    } else {
      onChange([...valoresSelecionados, valor]);
    }
  };

  return (
    <div className="py-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Switch
          checked={!disabled}
          onCheckedChange={(checked) => onDisabledChange(!checked)}
        />
      </div>
      {!disabled && (
        <div className="flex flex-wrap gap-1.5">
          {opcoes.map((opcao) => {
            const selecionado = valoresSelecionados.includes(opcao.valor);
            const isTop3 = autoTop3?.includes(opcao.valor);
            return (
              <Badge
                key={opcao.valor}
                variant={selecionado ? "default" : "outline"}
                className={`cursor-pointer text-xs ${
                  isTop3 && !selecionado ? "border-primary/50" : ""
                }`}
                onClick={() => toggleValor(opcao.valor)}
              >
                {opcao.label}
                {opcao.porcentagem !== undefined && (
                  <span className="ml-1 opacity-60">
                    {opcao.porcentagem.toFixed(0)}%
                  </span>
                )}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
