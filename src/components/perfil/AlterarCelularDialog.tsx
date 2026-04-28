import { useState, ReactNode } from "react";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Phone, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { validateCelularBR, formatCelularMask } from "@/lib/celular";

interface AlterarCelularDialogProps {
  celularAtual: string | null;
  onSuccess: () => void;
  trigger?: ReactNode;
  /** Controlled open state. If provided, internal trigger is hidden. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AlterarCelularDialog({
  celularAtual,
  onSuccess,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: AlterarCelularDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp! : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onOpenChangeProp?.(v);
    else setInternalOpen(v);
  };

  const [step, setStep] = useState<"input" | "verify" | "success">("input");
  const [novoCelular, setNovoCelular] = useState("");
  const [codigo, setCodigo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();
  const { user, profile } = useAuthContext();
  const isMobile = useIsMobile();

  const handleEnviarCodigo = async () => {
    const validation = validateCelularBR(novoCelular);
    if (!validation.ok) {
      toast({
        title: "Celular inválido",
        description: validation.reason || "Digite um celular válido com DDD",
        variant: "destructive",
      });
      return;
    }
    const numeros = validation.normalized!.replace(/^55/, "");

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
        description: `Verifique seu celular ${formatCelularMask(numeros)}`,
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

      const validation = validateCelularBR(novoCelular);
      const normalized = validation.normalized!;
      const { error: updateError } = await supabase
        .from("perfis")
        // whatsapp é sincronizado automaticamente via trigger sync_whatsapp_with_celular
        .update({ celular: normalized, celular_verificado: true })
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
      setStep("input");
      setNovoCelular("");
      setCodigo("");
      setCooldown(0);
    }
  };

  const Title = (
    <span className="flex items-center gap-2">
      <Phone className="h-5 w-5" />
      Alterar Celular
    </span>
  );

  const Body = (
    <>
      {step === "input" && (
        <div className="space-y-4 py-2 px-4">
          {celularAtual && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Celular atual</p>
              <p className="font-medium">{formatCelularMask(celularAtual.replace(/^55/, ""))}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="novoCelular">Novo celular</Label>
            <Input
              id="novoCelular"
              type="tel"
              placeholder="(11) 99999-9999"
              value={novoCelular}
              onChange={(e) => setNovoCelular(formatCelularMask(e.target.value))}
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
      )}

      {step === "verify" && (
        <div className="space-y-4 py-2 px-4">
          <p className="text-sm text-muted-foreground text-center">
            Digite o código de 6 dígitos enviado para{" "}
            <strong>{formatCelularMask(novoCelular)}</strong>
          </p>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={codigo} onChange={setCodigo}>
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
          <Button variant="ghost" onClick={handleReenviar} disabled={cooldown > 0} className="w-full">
            {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
          </Button>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col items-center py-8 px-4">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-accent" />
          </div>
          <h3 className="text-xl font-semibold text-accent">Celular alterado!</h3>
          <p className="text-muted-foreground text-center mt-2">
            Seu novo celular foi verificado com sucesso.
          </p>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        {!isControlled && trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{Title}</DrawerTitle>
            <DrawerDescription>
              {step === "input"
                ? "Digite seu novo número. Enviaremos um código SMS."
                : step === "verify"
                  ? "Confirme o código recebido."
                  : "Pronto!"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="pb-6">{Body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{Title}</DialogTitle>
          <DialogDescription>
            {step === "input"
              ? "Digite seu novo número de celular. Enviaremos um código SMS para verificação."
              : step === "verify"
                ? "Verifique o código recebido."
                : "Pronto!"}
          </DialogDescription>
        </DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  );
}
