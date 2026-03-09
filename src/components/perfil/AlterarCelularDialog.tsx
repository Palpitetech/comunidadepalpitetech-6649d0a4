import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Phone, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";

interface AlterarCelularDialogProps {
  celularAtual: string | null;
  onSuccess: () => void;
}

export function AlterarCelularDialog({ celularAtual, onSuccess }: AlterarCelularDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"input" | "verify" | "success">("input");
  const [novoCelular, setNovoCelular] = useState("");
  const [codigo, setCodigo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();
  const { user, profile } = useAuthContext();

  const formatCelular = (value: string) => {
    const numeros = value.replace(/\D/g, "");
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  const handleEnviarCodigo = async () => {
    const numeros = novoCelular.replace(/\D/g, "");
    if (numeros.length < 10 || numeros.length > 11) {
      toast({
        title: "Celular inválido",
        description: "Digite um celular válido com DDD",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("enviar-codigo-sms", {
        body: {
          user_id: user?.id,
          celular: numeros,
          tipo: "alteracao_celular",
          nome: profile?.nome || "Usuário",
        },
      });

      if (error) throw error;
      if (!data.sucesso) throw new Error(data.erro);

      setStep("verify");
      setCooldown(60);
      
      // Cooldown timer
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      toast({
        title: "Código enviado!",
        description: `Verifique seu celular ${formatCelular(numeros)}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao enviar código";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificarCodigo = async () => {
    if (codigo.length !== 6) {
      toast({
        title: "Código incompleto",
        description: "Digite os 6 dígitos do código",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verificar-codigo", {
        body: {
          user_id: user?.id,
          codigo,
          tipo: "alteracao_celular",
        },
      });

      if (error) throw error;
      if (!data.sucesso) throw new Error(data.erro);

      // Atualizar celular no perfil
      const numeros = novoCelular.replace(/\D/g, "");
      const { error: updateError } = await supabase
        .from("perfis")
        .update({ celular: numeros, celular_verificado: true })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      setStep("success");
      toast({
        title: "Celular alterado!",
        description: "Seu celular foi atualizado com sucesso.",
      });
      
      setTimeout(() => {
        setOpen(false);
        onSuccess();
        // Reset state
        setStep("input");
        setNovoCelular("");
        setCodigo("");
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Código inválido";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReenviar = () => {
    if (cooldown > 0) return;
    handleEnviarCodigo();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset on close
      setStep("input");
      setNovoCelular("");
      setCodigo("");
      setCooldown(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-12 text-senior-base gap-2">
          <Phone className="h-5 w-5" />
          Alterar Celular
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Alterar Celular
              </DialogTitle>
              <DialogDescription>
                Digite seu novo número de celular. Enviaremos um código SMS para verificação.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {celularAtual && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Celular atual</p>
                  <p className="font-medium">{formatCelular(celularAtual)}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="novoCelular">Novo celular</Label>
                <Input
                  id="novoCelular"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={novoCelular}
                  onChange={(e) => setNovoCelular(formatCelular(e.target.value))}
                  inputMode="numeric"
                  className="h-12 text-lg"
                />
              </div>
              <Button
                onClick={handleEnviarCodigo}
                disabled={isLoading || novoCelular.replace(/\D/g, "").length < 10}
                className="w-full h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar código SMS
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle>Verificar código</DialogTitle>
              <DialogDescription>
                Digite o código de 6 dígitos enviado para{" "}
                <strong>{formatCelular(novoCelular)}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={codigo}
                  onChange={setCodigo}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="h-12 w-12 text-xl" />
                    <InputOTPSlot index={1} className="h-12 w-12 text-xl" />
                    <InputOTPSlot index={2} className="h-12 w-12 text-xl" />
                    <InputOTPSlot index={3} className="h-12 w-12 text-xl" />
                    <InputOTPSlot index={4} className="h-12 w-12 text-xl" />
                    <InputOTPSlot index={5} className="h-12 w-12 text-xl" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                onClick={handleVerificarCodigo}
                disabled={isLoading || codigo.length !== 6}
                className="w-full h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  "Verificar"
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleReenviar}
                disabled={cooldown > 0}
                className="w-full"
              >
                {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
              </Button>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-accent">Celular alterado!</h3>
            <p className="text-muted-foreground text-center mt-2">
              Seu novo celular foi verificado com sucesso.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
