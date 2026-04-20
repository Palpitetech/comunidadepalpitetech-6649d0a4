import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Phone } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateCelularBR, formatCelularMask } from "@/lib/celular";

export function RequireCelularModal() {
  const { profile, user, updateProfile } = useAuthContext();
  const { toast } = useToast();
  const [celular, setCelular] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Show only for authenticated non-bot users without celular
  const isOpen = !!user && !!profile && !profile.is_bot && !profile.celular;

  const handleSave = async () => {
    const validation = validateCelularBR(celular);
    if (!validation.ok) {
      setError(validation.reason || "Celular inválido");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await updateProfile({ celular: validation.normalized!, whatsapp: validation.normalized! });

      // Trigger tag sync in background
      supabase.functions.invoke("sync-group-members", {
        body: { phone: validation.normalized! },
      }).catch(() => {});

      toast({ title: "Celular salvo!", description: "Seu número foi cadastrado com sucesso." });
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Cadastre seu celular
          </DialogTitle>
          <DialogDescription>
            Para ter a melhor experiência, precisamos do seu número de celular (WhatsApp).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="celular-modal">Celular (WhatsApp)</Label>
            <Input
              id="celular-modal"
              type="tel"
              inputMode="numeric"
              placeholder="(11) 99999-9999"
              value={celular}
              onChange={(e) => setCelular(formatCelularMask(e.target.value))}
              className="h-12 text-base"
              disabled={loading}
            />
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full h-12 text-base font-semibold">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              "Salvar e continuar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
