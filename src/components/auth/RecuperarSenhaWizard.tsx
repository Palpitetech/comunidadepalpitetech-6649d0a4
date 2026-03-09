import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StepIndicator } from "./steps/StepIndicator";
import { StepIdentificar } from "./steps/StepIdentificar";
import { StepCodigoRecuperacao } from "./steps/StepCodigoRecuperacao";
import { StepNovaSenha } from "./steps/StepNovaSenha";
import { StepSenhaAlterada } from "./steps/StepSenhaAlterada";
import { useRecuperarSenha } from "@/hooks/useRecuperarSenha";

interface RecuperarSenhaWizardProps {
  onVoltar: () => void;
}

export function RecuperarSenhaWizard({ onVoltar }: RecuperarSenhaWizardProps) {
  const [step, setStep] = useState(1);
  const [codigoVerificado, setCodigoVerificado] = useState("");

  const {
    state,
    isLoading,
    error,
    cooldown,
    buscarUsuario,
    redefinirSenha,
    reenviarCodigo,
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

  const handleCodigoVerificado = (codigo: string) => {
    setCodigoVerificado(codigo);
    setStep(3);
  };

  const handleRedefinirSenha = async (novaSenha: string) => {
    const result = await redefinirSenha(codigoVerificado, novaSenha);
    if (result.sucesso) {
      setStep(4);
    }
    return result;
  };

  const steps = [
    { number: 1, label: "Identificar" },
    { number: 2, label: "Código" },
    { number: 3, label: "Nova Senha" },
  ];

  return (
    <Card className="w-full max-w-lg shadow-none border-0 md:shadow-xl md:border">
      {step < 4 && (
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

      {step === 2 && state.userId && state.metodo && (
        <StepCodigoRecuperacao
          userId={state.userId}
          metodo={state.metodo}
          destinoMascarado={state.destinoMascarado}
          isLoading={isLoading}
          error={error}
          cooldown={cooldown}
          onVerificado={handleCodigoVerificado}
          onReenviar={reenviarCodigo}
          onVoltar={() => setStep(1)}
          resetError={resetError}
        />
      )}

      {step === 3 && (
        <StepNovaSenha
          isLoading={isLoading}
          error={error}
          codigo={codigoVerificado}
          onRedefinir={handleRedefinirSenha}
        />
      )}

      {step === 4 && (
        <StepSenhaAlterada onVoltarLogin={onVoltar} />
      )}
    </Card>
  );
}
