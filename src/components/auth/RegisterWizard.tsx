import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StepIndicator } from "./steps/StepIndicator";
import { StepDadosPessoais } from "./steps/StepDadosPessoais";
import { StepCodigoSMS } from "./steps/StepCodigoSMS";
import { StepSucesso } from "./steps/StepSucesso";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  nome: string;
  email: string;
  celular: string;
  password: string;
  userId: string;
}

export function RegisterWizard() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    email: "",
    celular: "",
    password: "",
    userId: "",
  });

  const { signUp } = useAuthContext();
  const { toast } = useToast();

  const handleFormDataChange = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleCriarConta = async () => {
    setIsLoading(true);
    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.nome,
        formData.celular.replace(/\D/g, "")
      );

      if (result?.user?.id) {
        setFormData((prev) => ({ ...prev, userId: result.user.id }));
        setStep(2);
        toast({
          title: "Conta criada!",
          description: "Enviamos um código de verificação para seu celular.",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar conta";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificado = () => {
    setStep(3);
  };

  return (
    <Card className="w-full max-w-lg shadow-xl">
      {/* Indicadores de etapa */}
      <div className="flex justify-center gap-6 p-6 border-b bg-muted/30">
        <StepIndicator
          number={1}
          label="Dados"
          active={step >= 1}
          completed={step > 1}
        />
        <div className="flex items-center">
          <div className={`w-12 h-1 rounded ${step > 1 ? "bg-accent" : "bg-muted"}`} />
        </div>
        <StepIndicator
          number={2}
          label="Código"
          active={step >= 2}
          completed={step > 2}
        />
        <div className="flex items-center">
          <div className={`w-12 h-1 rounded ${step > 2 ? "bg-accent" : "bg-muted"}`} />
        </div>
        <StepIndicator
          number={3}
          label="Pronto"
          active={step >= 3}
          completed={step > 3}
        />
      </div>

      {/* Conteúdo da etapa atual */}
      {step === 1 && (
        <StepDadosPessoais
          formData={formData}
          onFormDataChange={handleFormDataChange}
          onNext={handleCriarConta}
          isLoading={isLoading}
        />
      )}

      {step === 2 && (
        <StepCodigoSMS
          userId={formData.userId}
          celular={formData.celular}
          onVerified={handleVerificado}
        />
      )}

      {step === 3 && <StepSucesso />}
    </Card>
  );
}
