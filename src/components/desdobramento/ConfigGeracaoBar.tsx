import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface ConfigGeracaoBarProps {
  qtdDezenas: number;
  onQtdDezenasChange: (value: number) => void;
  qtdPalpites: number;
  onQtdPalpitesChange: (value: number) => void;
  disabled?: boolean;
}

export function ConfigGeracaoBar({
  qtdDezenas,
  onQtdDezenasChange,
  qtdPalpites,
  onQtdPalpitesChange,
  disabled = false,
}: ConfigGeracaoBarProps) {
  const [dezenasInput, setDezenasInput] = useState(qtdDezenas.toString());
  const [palpitesInput, setPalpitesInput] = useState(qtdPalpites.toString());

  useEffect(() => {
    setDezenasInput(qtdDezenas.toString());
  }, [qtdDezenas]);

  useEffect(() => {
    setPalpitesInput(qtdPalpites.toString());
  }, [qtdPalpites]);

  const handleDezenasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setDezenasInput(rawValue);
    const numValue = parseInt(rawValue, 10);
    if (!isNaN(numValue) && numValue >= 15 && numValue <= 20) {
      onQtdDezenasChange(numValue);
    }
  };

  const handleDezenasBlur = () => {
    const numValue = parseInt(dezenasInput, 10);
    if (isNaN(numValue) || numValue < 15) {
      setDezenasInput("15");
      onQtdDezenasChange(15);
    } else if (numValue > 20) {
      setDezenasInput("20");
      onQtdDezenasChange(20);
    }
  };

  const handlePalpitesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    setPalpitesInput(rawValue);
    const numValue = parseInt(rawValue, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 250) {
      onQtdPalpitesChange(numValue);
    }
  };

  const handlePalpitesBlur = () => {
    const numValue = parseInt(palpitesInput, 10);
    if (isNaN(numValue) || numValue < 1) {
      setPalpitesInput("1");
      onQtdPalpitesChange(1);
    } else if (numValue > 250) {
      setPalpitesInput("250");
      onQtdPalpitesChange(250);
    }
  };

  return (
    <div className="flex items-center justify-center gap-6 py-3">
      {/* Dezenas por palpite */}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          inputMode="numeric"
          value={dezenasInput}
          onChange={handleDezenasChange}
          onBlur={handleDezenasBlur}
          disabled={disabled}
          className="w-14 h-10 text-center text-base font-semibold bg-card"
        />
        <span className="text-sm text-muted-foreground">dezenas</span>
      </div>

      <span className="text-muted-foreground">×</span>

      {/* Quantidade de palpites */}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          inputMode="numeric"
          value={palpitesInput}
          onChange={handlePalpitesChange}
          onBlur={handlePalpitesBlur}
          disabled={disabled}
          className="w-16 h-10 text-center text-base font-semibold bg-card"
        />
        <span className="text-sm text-muted-foreground">palpites</span>
      </div>
    </div>
  );
}
