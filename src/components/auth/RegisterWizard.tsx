import React, { useState, useEffect } from "react";
import { StepIndicator } from "./steps/StepIndicator";
import { StepDadosPessoais } from "./steps/StepDadosPessoais";
import { StepEscolhaVerificacao } from "./steps/StepEscolhaVerificacao";
import { StepCodigoOTP } from "./steps/StepCodigoOTP";
import { StepSucesso } from "./steps/StepSucesso";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useVerificacao } from "@/hooks/useVerificacao";
import { captureReferralCode, getStoredReferralCode, clearStoredReferralCode } from "@/hooks/useConvites";

interface FormData {
  nome: string;
  email: string;
  celular: string;
  password: string;
  userId: string;
  tipoVerificacao: 'sms' | 'email' | null;
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
    tipoVerificacao: null,
  });

  const { signUp } = useAuthContext();
  const { toast } = useToast();
  const { enviarCodigo, isLoading: isEnviandoCodigo } = useVerificacao();

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
      
      const result = await signUp(
        formData.email,
        formData.password,
        formData.nome,
        formData.celular.replace(/\D/g, ""),
        referralCode || undefined
      );

      if (result?.user?.id) {
        clearStoredReferralCode();
        
        setFormData((prev) => ({ ...prev, userId: result.user.id }));
        setStep(2);
        toast({
          title: "Conta criada!",
          description: "Escolha como deseja verificar sua conta.",
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

  const handleEscolhaVerificacao = async (tipo: 'sms' | 'email') => {
    setFormData((prev) => ({ ...prev, tipoVerificacao: tipo }));
    
    const destino = tipo === 'email' ? formData.email : formData.celular.replace(/\D/g, "");
    
    const result = await enviarCodigo({
      userId: formData.userId,
      tipo,
      destino,
      nome: formData.nome,
    });

    if (result.sucesso) {
      setStep(3);
      toast({
        title: "Código enviado!",
        description: `Verifique seu ${tipo === 'email' ? 'email' : 'celular'}.`,
      });
    } else {
      toast({
        title: "Erro ao enviar código",
        description: result.erro,
        variant: "destructive",
      });
    }
  };

  const handleVerificado = () => {
    setStep(4);
  };

  const getDestinoVerificacao = () => {
    if (formData.tipoVerificacao === 'email') {
      return formData.email;
    }
    return formData.celular.replace(/\D/g, "");
  };

  const steps = [
    { number: 1, label: "Dados" },
    { number: 2, label: "Escolha" },
    { number: 3, label: "Código" },
    { number: 4, label: "Pronto" },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Step indicator - desktop only */}
      <div className="hidden md:block px-4 py-2 md:p-6 border-b bg-muted/30 shrink-0">
        <StepIndicator currentStep={step} steps={steps} />
      </div>

      {/* Step content - fills remaining space */}
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
          <StepEscolhaVerificacao
            email={formData.email}
            celular={formData.celular}
            onEscolha={handleEscolhaVerificacao}
            isLoading={isEnviandoCodigo}
          />
        )}

        {step === 3 && formData.tipoVerificacao && (
          <StepCodigoOTP
            userId={formData.userId}
            tipo={formData.tipoVerificacao}
            destino={getDestinoVerificacao()}
            nome={formData.nome}
            onVerified={handleVerificado}
          />
        )}

        {step === 4 && <StepSucesso />}
      </div>
    </div>
  );
};
