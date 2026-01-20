import { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

interface StepNovaSenhaProps {
  isLoading: boolean;
  error: string | null;
  codigo: string;
  onRedefinir: (novaSenha: string) => Promise<{ sucesso: boolean }>;
}

export function StepNovaSenha({ isLoading, error, codigo, onRedefinir }: StepNovaSenhaProps) {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLocal(null);

    if (senha.length < 6) {
      setErroLocal("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErroLocal("As senhas não coincidem.");
      return;
    }

    await onRedefinir(senha);
  };

  const senhasConferem = senha.length >= 6 && senha === confirmarSenha;
  const displayError = erroLocal || error;

  return (
    <>
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-senior-2xl">Nova Senha</CardTitle>
        <CardDescription className="text-senior-base">
          Defina sua nova senha. Ela deve ter pelo menos 6 caracteres.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nova-senha" className="text-senior-base flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="nova-senha"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  setErroLocal(null);
                }}
                className="input-senior pr-12"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar-senha" className="text-senior-base flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Confirmar Senha
            </Label>
            <Input
              id="confirmar-senha"
              type={showPassword ? "text" : "password"}
              placeholder="Repita a nova senha"
              value={confirmarSenha}
              onChange={(e) => {
                setConfirmarSenha(e.target.value);
                setErroLocal(null);
              }}
              className="input-senior"
            />
          </div>

          {/* Indicador de senhas conferindo */}
          {senha.length >= 6 && confirmarSenha.length > 0 && (
            <div
              className={`flex items-center gap-2 text-senior-sm ${
                senhasConferem ? "text-green-600" : "text-amber-600"
              }`}
            >
              {senhasConferem ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Senhas conferem!
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  As senhas não coincidem
                </>
              )}
            </div>
          )}

          {displayError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6 flex-shrink-0" />
              <p className="text-senior-base">{displayError}</p>
            </div>
          )}

          <Button
            type="submit"
            className="btn-senior w-full"
            disabled={isLoading || !senhasConferem}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Alterando...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Alterar Senha
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </>
  );
}
