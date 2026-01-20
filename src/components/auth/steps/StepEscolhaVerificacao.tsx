import { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Phone, Mail, Shield } from "lucide-react";

interface StepEscolhaVerificacaoProps {
  email: string;
  celular: string;
  onEscolha: (tipo: 'sms' | 'email') => void;
  isLoading: boolean;
}

export function StepEscolhaVerificacao({ email, celular, onEscolha, isLoading }: StepEscolhaVerificacaoProps) {
  const [selecionado, setSelecionado] = useState<'sms' | 'email' | null>(null);

  // Mascarar dados para exibição
  const celularFormatado = celular.replace(/\D/g, '');
  const celularMascarado = celularFormatado.length >= 8 
    ? `(${celularFormatado.slice(0, 2)}) *****-${celularFormatado.slice(-4)}`
    : celular;

  const [localPart, domain] = email.split('@');
  const emailMascarado = localPart && domain 
    ? `${localPart.slice(0, 2)}***@${domain}` 
    : email;

  const handleContinuar = () => {
    if (selecionado) {
      onEscolha(selecionado);
    }
  };

  return (
    <>
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-senior-2xl">Verificar sua conta</CardTitle>
        <CardDescription className="text-senior-base">
          Escolha como deseja receber o código de verificação
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Opção SMS */}
        <button
          type="button"
          onClick={() => setSelecionado('sms')}
          disabled={isLoading}
          className={`w-full flex items-center gap-4 p-6 rounded-xl border-2 transition-all duration-200 text-left
            ${selecionado === 'sms' 
              ? 'border-primary bg-primary/5 shadow-md' 
              : 'border-muted hover:border-primary/50'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0
            ${selecionado === 'sms' ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}
          >
            <Phone className={`w-7 h-7 ${selecionado === 'sms' ? '' : 'text-primary'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-senior-lg font-semibold text-foreground">SMS no celular</p>
            <p className="text-senior-base text-muted-foreground truncate">{celularMascarado}</p>
          </div>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
            ${selecionado === 'sms' ? 'border-primary bg-primary' : 'border-muted'}`}
          >
            {selecionado === 'sms' && (
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            )}
          </div>
        </button>

        {/* Opção Email */}
        <button
          type="button"
          onClick={() => setSelecionado('email')}
          disabled={isLoading}
          className={`w-full flex items-center gap-4 p-6 rounded-xl border-2 transition-all duration-200 text-left
            ${selecionado === 'email' 
              ? 'border-primary bg-primary/5 shadow-md' 
              : 'border-muted hover:border-primary/50'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0
            ${selecionado === 'email' ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}
          >
            <Mail className={`w-7 h-7 ${selecionado === 'email' ? '' : 'text-primary'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-senior-lg font-semibold text-foreground">Email</p>
            <p className="text-senior-base text-muted-foreground truncate">{emailMascarado}</p>
          </div>
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
            ${selecionado === 'email' ? 'border-primary bg-primary' : 'border-muted'}`}
          >
            {selecionado === 'email' && (
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            )}
          </div>
        </button>

        {/* Botão Continuar */}
        <Button
          onClick={handleContinuar}
          className="btn-senior w-full"
          disabled={!selecionado || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Enviando código...
            </>
          ) : (
            "Enviar código"
          )}
        </Button>

        <p className="text-center text-muted-foreground text-senior-sm">
          O código de 6 dígitos será enviado para o destino escolhido
        </p>
      </CardContent>
    </>
  );
}
