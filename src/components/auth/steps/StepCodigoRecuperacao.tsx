import { useState, useEffect } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, CheckCircle, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
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
  const [tempoRestante, setTempoRestante] = useState(600);
  const [verificando, setVerificando] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const tipoTexto = metodo === "email" ? "email" : "SMS";

  useEffect(() => {
    if (tempoRestante <= 0) return;
    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
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
      if (fnError) { setErroLocal("Erro ao verificar código"); return; }
      if (!data.sucesso) { setErroLocal(data.erro); return; }
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
      <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
        <CardTitle className="text-xl md:text-senior-2xl">Digite o código</CardTitle>
        <CardDescription className="text-sm md:text-senior-base">
          Enviamos um código de 6 dígitos para
          <br />
          <span className="font-semibold text-foreground">{destinoMascarado}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
        {/* Timer */}
        <div className="text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-lg md:text-senior-xl font-mono font-bold ${
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
            <p className="text-destructive text-xs md:text-senior-sm mt-2">
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
            <InputOTPGroup className="gap-1.5 md:gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="w-11 h-12 md:w-14 md:h-16 text-2xl md:text-3xl font-bold border-2 rounded-lg md:rounded-xl focus:ring-4 focus:ring-primary/50"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {/* Erro */}
        {displayError && (
          <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
            <p className="text-sm md:text-senior-base">{displayError}</p>
          </div>
        )}

        {/* Verificar */}
        <Button
          onClick={handleVerificar}
          className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl"
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

        {/* Reenviar */}
        <div className="text-center pt-2 md:pt-4 border-t">
          <p className="text-muted-foreground text-xs md:text-senior-sm mb-2 md:mb-3">
            Não recebeu o {tipoTexto}?
          </p>
          <Button
            variant="outline"
            onClick={handleReenviar}
            disabled={cooldown > 0 || isLoadingAny}
            className="h-10 md:h-12 px-4 md:px-6 text-sm md:text-senior-base"
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
                <RefreshCw className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                Reenviar código
              </>
            )}
          </Button>
        </div>

        {/* Voltar */}
        <Button
          type="button"
          variant="ghost"
          onClick={onVoltar}
          className="w-full h-10 md:h-12 text-sm md:text-senior-base"
        >
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          Voltar
        </Button>
      </CardContent>
    </>
  );
}
