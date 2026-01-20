import { useState, useEffect } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, CheckCircle, AlertCircle, RefreshCw, Phone } from "lucide-react";
import { useVerificacaoSMS } from "@/hooks/useVerificacaoSMS";

interface StepCodigoSMSProps {
  userId: string;
  celular: string;
  onVerified: () => void;
}

export function StepCodigoSMS({ userId, celular, onVerified }: StepCodigoSMSProps) {
  const [codigo, setCodigo] = useState("");
  const [destinoMascarado, setDestinoMascarado] = useState("");
  const [tempoRestante, setTempoRestante] = useState(600); // 10 minutos em segundos
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  
  const { enviarCodigo, verificarCodigo, isLoading, error, cooldown, resetError } = useVerificacaoSMS();

  // Timer de expiração do código
  useEffect(() => {
    if (!codigoEnviado || tempoRestante <= 0) return;

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
  }, [codigoEnviado, tempoRestante]);

  // Enviar código ao montar
  useEffect(() => {
    if (!codigoEnviado && userId && celular) {
      handleEnviarCodigo();
    }
  }, [userId, celular]);

  const handleEnviarCodigo = async () => {
    resetError();
    const result = await enviarCodigo(userId, celular);
    
    if (result.sucesso) {
      setCodigoEnviado(true);
      setTempoRestante(600);
      setCodigo("");
      if (result.destino_mascarado) {
        setDestinoMascarado(result.destino_mascarado);
      }
    }
  };

  const handleVerificar = async () => {
    if (codigo.length !== 6) return;
    
    resetError();
    const result = await verificarCodigo(userId, codigo);
    
    if (result.sucesso) {
      onVerified();
    }
  };

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min.toString().padStart(2, "0")}:${seg.toString().padStart(2, "0")}`;
  };

  const codigoExpirado = tempoRestante <= 0;

  return (
    <>
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Phone className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-senior-2xl">Digite o código</CardTitle>
        <CardDescription className="text-senior-base">
          {codigoEnviado ? (
            <>
              Enviamos um código de 6 dígitos para
              <br />
              <span className="font-semibold text-foreground">{destinoMascarado || celular}</span>
            </>
          ) : (
            "Enviando código de verificação..."
          )}
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
              resetError();
            }}
            disabled={isLoading || codigoExpirado}
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
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <p className="text-senior-base">{error}</p>
          </div>
        )}

        {/* Botão Verificar */}
        <Button
          onClick={handleVerificar}
          className="btn-senior w-full"
          disabled={codigo.length !== 6 || isLoading || codigoExpirado}
        >
          {isLoading ? (
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
            Não recebeu o SMS?
          </p>
          <Button
            variant="outline"
            onClick={handleEnviarCodigo}
            disabled={cooldown > 0 || isLoading}
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
      </CardContent>
    </>
  );
}
