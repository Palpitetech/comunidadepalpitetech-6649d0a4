import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StepIndicator } from "./steps/StepIndicator";
import { StepIdentificar } from "./steps/StepIdentificar";
import { StepSenhaAlterada } from "./steps/StepSenhaAlterada";
import { useRecuperarSenha } from "@/hooks/useRecuperarSenha";

interface RecuperarSenhaWizardProps {
  onVoltar: () => void;
}

export function RecuperarSenhaWizard({ onVoltar }: RecuperarSenhaWizardProps) {
  const [step, setStep] = useState(1);

  const {
    isLoading,
    error,
    buscarUsuario,
    resetError,
  } = useRecuperarSenha();

  const handleBuscarUsuario = async (identificador: string) => {
    resetError();
    const result = await buscarUsuario(identificador);
    if (result.sucesso) {
      setStep(2);
    }
    return result;
  };

  const steps = [
    { number: 1, label: "Identificar" },
    { number: 2, label: "Concluído" },
  ];

  return (
    <Card className="w-full max-w-lg shadow-none border-0 md:shadow-xl md:border">
      {step < 2 && (
        <div className="pt-4 px-4 md:pt-6 md:px-6">
          <StepIndicator currentStep={step} steps={steps} />
        </div>
      )}

      {step === 1 && (
        <StepIdentificar
          isLoading={isLoading}
          error={error}
          onBuscar={handleBuscarUsuario}
          onVoltar={onVoltar}
        />
      )}

      {step === 2 && (
        <StepSenhaAlterada onVoltarLogin={onVoltar} />
      )}
    </Card>
  );
}
