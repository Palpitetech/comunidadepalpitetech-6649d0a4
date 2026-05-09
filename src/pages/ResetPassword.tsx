import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [canReset, setCanReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let mounted = true;
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(window.location.search);
    const linkError = hashParams.get("error_description") || searchParams.get("error_description");
    const recoveryType = hashParams.get("type") || searchParams.get("type");
    const hasRecoveryLink = recoveryType === "recovery";

    if (linkError) {
      setError("Link inválido ou expirado. Gere um novo link de redefinição.");
      setReady(true);
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (hasRecoveryLink && session)) {
        setCanReset(true);
        setError(null);
        setReady(true);
      }
    });

    const validateRecoverySession = async () => {
      const code = searchParams.get("code");
      if (code && hasRecoveryLink) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data.session && hasRecoveryLink) {
          setCanReset(true);
          setError(null);
          setReady(true);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      if (!mounted) return;
      setError("Não foi possível validar este link. Ele pode ter expirado ou já ter sido usado.");
      setReady(true);
    };

    validateRecoverySession();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canReset) {
      toast.error("Link inválido ou expirado");
      return;
    }
    if (password.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não conferem");
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(true);
      toast.success("Senha atualizada com sucesso");
      await supabase.auth.signOut({ scope: "local" });
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível atualizar a senha.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-8">
      <Helmet>
        <title>Redefinir senha | Palpite Tech</title>
        <meta name="description" content="Crie uma nova senha segura para acessar sua conta Palpite Tech." />
      </Helmet>

      <Card className="w-full max-w-md border-2 shadow-lg">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            {success ? <CheckCircle2 className="h-7 w-7" /> : <LockKeyhole className="h-7 w-7" />}
          </div>
          <CardTitle className="text-senior-2xl">Criar nova senha</CardTitle>
          <CardDescription className="text-senior-base">
            Digite uma nova senha para voltar a acessar sua conta.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!ready ? (
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-senior-base">Validando link...</p>
            </div>
          ) : error ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="text-senior-base font-medium">{error}</p>
                </div>
              </div>
              <Button asChild className="w-full h-12 text-senior-base">
                <Link to="/login">Voltar para o login</Link>
              </Button>
            </div>
          ) : success ? (
            <div className="space-y-5 text-center">
              <p className="text-senior-base text-muted-foreground">
                Sua senha foi atualizada. Você será direcionado para entrar novamente.
              </p>
              <Button className="w-full h-12 text-senior-base" onClick={() => navigate("/login", { replace: true })}>
                Entrar agora
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-senior-base">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    className="h-12 pr-12 text-senior-base"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-senior-base">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  className="h-12 text-senior-base"
                  minLength={8}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 text-senior-base" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Salvar nova senha
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}