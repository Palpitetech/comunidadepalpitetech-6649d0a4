import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

interface PedidoEspecialInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PedidoEspecialInput({
  value,
  onChange,
  disabled = false,
}: PedidoEspecialInputProps) {
  const maxLength = 200;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Pedido Especial (opcional)</Label>
      
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder="Ex: Quero jogos com mais números pares..."
        className="resize-none text-sm"
        rows={2}
        disabled={disabled}
        maxLength={maxLength}
      />
      
      <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-md">
        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-tight">
          O pedido será atendido dentro das possibilidades matemáticas. 
          Recomendamos deixar os demais filtros no padrão para melhores resultados.
        </p>
      </div>
      
      <div className="text-right">
        <span className="text-[10px] text-muted-foreground">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
