import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AtivarConta() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (tokenHash && type) {
        // Verify the OTP token to establish session
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as "magiclink",
        });

        if (error) {
          toast({
            title: "Link expirado ou inválido",
            description: "Solicite um novo link de ativação.",
            variant: "destructive",
          });
          navigate("/login", { replace: true });
          return;
        }
      }

      // Check if we have a session now
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Link expirado ou inválido",
          description: "Faça login ou solicite um novo link de ativação.",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
        return;
      }
      setCheckingSession(false);
    };

    // Small delay to let Supabase process any hash fragments
    const timer = setTimeout(verifyToken, 500);
    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (senha.length < 8) {
      toast({ title: "A senha deve ter pelo menos 8 caracteres", variant: "destructive" });
      return;
    }

    if (senha !== confirmarSenha) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: senha });
      if (updateError) throw updateError;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from("perfis")
          .update({ email_verificado: true })
          .eq("id", session.user.id);
      }

      toast({ title: "Conta ativada com sucesso! 🎉" });
      navigate("/comunidade", { replace: true });
    } catch (err: any) {
      toast({ title: "Erro ao ativar conta", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Crie sua senha de acesso</CardTitle>
          <CardDescription className="text-base">Você está quase lá!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha *</label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar senha *</label>
              <Input
                type="password"
                placeholder="Repita a senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Ativando..." : "Ativar minha conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
