import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PedidoEspecialInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PedidoEspecialInput({
  value,
  onChange,
  disabled,
}: PedidoEspecialInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Pedido Especial (opcional)</Label>
      <Textarea
        placeholder="Ex: Quero jogos com muitos números ímpares..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={2}
        className="text-sm resize-none"
      />
    </div>
  );
}
