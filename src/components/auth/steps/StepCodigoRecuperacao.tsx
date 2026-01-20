import { useState, useEffect } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Phone, Mail, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StepCodigoRecuperacaoProps {
  userId: string;
  metodo: "sms" | "email";
  destinoMascarado: string;
  isLoading: boolean;
  error: string | null;
  cooldown: number;
  onVerificado: (codigo: string) => void;
  onReenviar: () => Promise<{ sucesso: boolean }>;
  onVoltar: () => void;
  resetError: () => void;
}

export function StepCodigoRecuperacao({
  userId,
  metodo,
  destinoMascarado,
  isLoading,
  error,
  cooldown,
  onVerificado,
  onReenviar,
  onVoltar,
  resetError,
}: StepCodigoRecuperacaoProps) {
  const [codigo, setCodigo] = useState("");
  const [tempoRestante, setTempoRestante] = useState(600); // 10 minutos
  const [verificando, setVerificando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const Icon = metodo === "email" ? Mail : Phone;
  const tipoTexto = metodo === "email" ? "email" : "SMS";

  // Timer de expiração
  useEffect(() => {
    if (tempoRestante <= 0) return;

    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tempoRestante]);

  const handleVerificar = async () => {
    if (codigo.length !== 6) return;

    setVerificando(true);
    setErroLocal(null);
    resetError();

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verificar-codigo", {
        body: { user_id: userId, codigo },
      });

      if (fnError) {
        setErroLocal("Erro ao verificar código");
        return;
      }

      if (!data.sucesso) {
        setErroLocal(data.erro);
        return;
      }

      onVerificado(codigo);
    } catch (err: any) {
      setErroLocal(err.message || "Erro ao verificar código");
    } finally {
      setVerificando(false);
    }
  };

  const handleReenviar = async () => {
    setErroLocal(null);
    resetError();
    const result = await onReenviar();
    if (result.sucesso) {
      setTempoRestante(600);
      setCodigo("");
    }
  };

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min.toString().padStart(2, "0")}:${seg.toString().padStart(2, "0")}`;
  };

  const codigoExpirado = tempoRestante <= 0;
  const displayError = erroLocal || error;
  const isLoadingAny = isLoading || verificando;

  return (
    <>
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-senior-2xl">Digite o código</CardTitle>
        <CardDescription className="text-senior-base">
          Enviamos um código de 6 dígitos para
          <br />
          <span className="font-semibold text-foreground">{destinoMascarado}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Timer */}
        <div className="text-center">
          <div
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-senior-xl font-mono font-bold ${
              codigoExpirado
                ? "bg-destructive/10 text-destructive"
                : tempoRestante <= 60
                ? "bg-amber-100 text-amber-700"
                : "bg-primary/10 text-primary"
            }`}
          >
            ⏱ {formatarTempo(tempoRestante)}
          </div>
          {codigoExpirado && (
            <p className="text-destructive text-senior-sm mt-2">
              Código expirado. Solicite um novo.
            </p>
          )}
        </div>

        {/* Input OTP */}
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={codigo}
            onChange={(value) => {
              setCodigo(value);
              setErroLocal(null);
              resetError();
            }}
            disabled={isLoadingAny || codigoExpirado}
          >
            <InputOTPGroup className="gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="w-14 h-16 text-3xl font-bold border-2 rounded-xl focus:ring-4 focus:ring-primary/50"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Mensagem de erro */}
        {displayError && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <p className="text-senior-base">{displayError}</p>
          </div>
        )}

        {/* Botão Verificar */}
        <Button
          onClick={handleVerificar}
          className="btn-senior w-full"
          disabled={codigo.length !== 6 || isLoadingAny || codigoExpirado}
        >
          {verificando ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Verificando...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Verificar Código
            </>
          )}
        </Button>

        {/* Reenviar código */}
        <div className="text-center pt-4 border-t">
          <p className="text-muted-foreground text-senior-sm mb-3">
            Não recebeu o {tipoTexto}?
          </p>
          <Button
            variant="outline"
            onClick={handleReenviar}
            disabled={cooldown > 0 || isLoadingAny}
            className="h-12 px-6 text-senior-base"
          >
            {cooldown > 0 ? (
              <>Aguarde {cooldown}s</>
            ) : isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Reenviar código
              </>
            )}
          </Button>
        </div>

        {/* Voltar */}
        <div className="pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onVoltar}
            className="w-full h-12 text-senior-base"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>
        </div>
      </CardContent>
    </>
  );
}
