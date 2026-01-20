import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StepIndicator } from "./steps/StepIndicator";
import { StepDadosPessoais } from "./steps/StepDadosPessoais";
import { StepEscolhaVerificacao } from "./steps/StepEscolhaVerificacao";
import { StepCodigoOTP } from "./steps/StepCodigoOTP";
import { StepSucesso } from "./steps/StepSucesso";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useVerificacao } from "@/hooks/useVerificacao";

interface FormData {
  nome: string;
  email: string;
  celular: string;
  password: string;
  userId: string;
  tipoVerificacao: 'sms' | 'email' | null;
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
    tipoVerificacao: null,
  });

  const { signUp } = useAuthContext();
  const { toast } = useToast();
  const { enviarCodigo, isLoading: isEnviandoCodigo } = useVerificacao();

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

  return (
    <Card className="w-full max-w-lg shadow-xl">
      {/* Indicadores de etapa */}
      <div className="flex justify-center items-center gap-3 p-6 border-b bg-muted/30 flex-wrap">
        <StepIndicator
          number={1}
          label="Dados"
          active={step >= 1}
          completed={step > 1}
        />
        <div className="flex items-center">
          <div className={`w-8 h-1 rounded ${step > 1 ? "bg-accent" : "bg-muted"}`} />
        </div>
        <StepIndicator
          number={2}
          label="Escolha"
          active={step >= 2}
          completed={step > 2}
        />
        <div className="flex items-center">
          <div className={`w-8 h-1 rounded ${step > 2 ? "bg-accent" : "bg-muted"}`} />
        </div>
        <StepIndicator
          number={3}
          label="Código"
          active={step >= 3}
          completed={step > 3}
        />
        <div className="flex items-center">
          <div className={`w-8 h-1 rounded ${step > 3 ? "bg-accent" : "bg-muted"}`} />
        </div>
        <StepIndicator
          number={4}
          label="Pronto"
          active={step >= 4}
          completed={step > 4}
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
    </Card>
  );
}
