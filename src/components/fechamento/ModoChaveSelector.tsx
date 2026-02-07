import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { MousePointer2, Pin } from "lucide-react";

interface ModoChaveSelectorProps {
  value: "selecionar" | "fixar";
  onChange: (value: "selecionar" | "fixar") => void;
}

export function ModoChaveSelector({ value, onChange }: ModoChaveSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-senior-base font-medium">
        Modo de Seleção
      </Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as "selecionar" | "fixar")}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="selecionar" id="selecionar" />
          <Label 
            htmlFor="selecionar" 
            className="flex items-center gap-2 cursor-pointer text-senior-base"
          >
            <MousePointer2 className="h-4 w-4" />
            Selecionar
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="fixar" id="fixar" />
          <Label 
            htmlFor="fixar" 
            className="flex items-center gap-2 cursor-pointer text-senior-base"
          >
            <Pin className="h-4 w-4" />
            Fixar
          </Label>
        </div>
      </RadioGroup>
      <p className="text-sm text-muted-foreground">
        {value === "selecionar" 
          ? "Clique nas dezenas para selecioná-las para o fechamento."
          : "Dezenas fixas estarão em todos os jogos gerados."
        }
      </p>
    </div>
  );
}
