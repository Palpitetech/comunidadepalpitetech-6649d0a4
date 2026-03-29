import React, { useState, useEffect } from "react";
import { StepIndicator } from "./steps/StepIndicator";
import { StepDadosPessoais } from "./steps/StepDadosPessoais";
import { StepCodigoOTP } from "./steps/StepCodigoOTP";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { captureReferralCode, getStoredReferralCode, clearStoredReferralCode } from "@/hooks/useConvites";
import { getStoredUTM, clearUTM } from "@/hooks/useUTM";
import { supabase } from "@/integrations/supabase/client";

interface FormData {
  nome: string;
  email: string;
  celular: string;
  password: string;
  userId: string;
}

export interface RegisterWizardProps {
  initialData?: Partial<Pick<FormData, "email" | "celular" | "nome">>;
}

function formatCelularBR(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) {
    const is9 = digits.length === 11;
    const mid = is9 ? 7 : 6;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, mid)}-${digits.slice(mid)}`;
  }
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return formatCelularBR(digits.slice(2));
  }
  return value;
}

export const RegisterWizard: React.FC<RegisterWizardProps> = ({ initialData }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    email: initialData?.email ? String(initialData.email).toLowerCase() : "",
    celular: initialData?.celular ? formatCelularBR(String(initialData.celular)) : "",
    password: "",
    userId: "",
  });

  const { signUp } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    captureReferralCode();
  }, []);

  const handleFormDataChange = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleCriarConta = async () => {
    setIsLoading(true);
    try {
      const referralCode = getStoredReferralCode();
      const celularLimpo = formData.celular.replace(/\D/g, "");

      const result = await signUp(
        formData.email,
        formData.password,
        formData.nome,
        celularLimpo || undefined,
        referralCode || undefined
      );

      if (result?.user?.id) {
        clearStoredReferralCode();

        const utm = getStoredUTM();
        if (utm) {
          await supabase
            .from("perfis")
            .update({ utm_source: utm } as any)
            .eq("id", result.user.id);
          clearUTM();
        }

        setFormData((prev) => ({ ...prev, userId: result.user.id }));
        setStep(2);
        toast({
          title: "Conta criada!",
          description: "Vamos enviar seu código de verificação por e-mail.",
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
    window.location.href = "/comunidade";
  };

  const steps = [
    { number: 1, label: "Dados" },
    { number: 2, label: "Código" },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="hidden md:block px-4 py-2 md:p-6 border-b bg-muted/30 shrink-0">
        <StepIndicator currentStep={step} steps={steps} />
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        {step === 1 && (
          <StepDadosPessoais
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNext={handleCriarConta}
            isLoading={isLoading}
          />
        )}

        {step === 2 && (
          <StepCodigoOTP
            userId={formData.userId}
            tipo="email"
            destino={formData.email}
            nome={formData.nome}
            onVerified={handleVerificado}
          />
        )}
      </div>
    </div>
  );
};

