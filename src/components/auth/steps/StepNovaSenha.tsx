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
    if (senha.length < 6) { setErroLocal("A senha deve ter pelo menos 6 caracteres."); return; }
    if (senha !== confirmarSenha) { setErroLocal("As senhas não coincidem."); return; }
    await onRedefinir(senha);
  };

  const senhasConferem = senha.length >= 6 && senha === confirmarSenha;
  const displayError = erroLocal || error;

  return (
    <>
      <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
        <CardTitle className="text-xl md:text-senior-2xl">Nova Senha</CardTitle>
        <CardDescription className="text-sm md:text-senior-base">
          Defina sua nova senha. Ela deve ter pelo menos 6 caracteres.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 md:px-6">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="nova-senha" className="text-sm md:text-senior-base flex items-center gap-2">
              <Lock className="h-4 w-4 md:h-5 md:w-5" />
              Nova Senha
            </Label>
            <div className="relative">
              <Input
                id="nova-senha"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setErroLocal(null); }}
                className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 pr-12 rounded-lg md:rounded-xl border-2 focus:border-primary"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 md:h-9 md:w-9"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4 md:h-5 md:w-5" /> : <Eye className="h-4 w-4 md:h-5 md:w-5" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="confirmar-senha" className="text-sm md:text-senior-base flex items-center gap-2">
              <Lock className="h-4 w-4 md:h-5 md:w-5" />
              Confirmar Senha
            </Label>
            <Input
              id="confirmar-senha"
              type={showPassword ? "text" : "password"}
              placeholder="Repita a nova senha"
              value={confirmarSenha}
              onChange={(e) => { setConfirmarSenha(e.target.value); setErroLocal(null); }}
              className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
            />
          </div>

          {senha.length >= 6 && confirmarSenha.length > 0 && (
            <div className={`flex items-center gap-2 text-xs md:text-senior-sm ${senhasConferem ? "text-green-600" : "text-amber-600"}`}>
              {senhasConferem ? (
                <><CheckCircle className="h-4 w-4" /> Senhas conferem!</>
              ) : (
                <><AlertCircle className="h-4 w-4" /> As senhas não coincidem</>
              )}
            </div>
          )}

          {displayError && (
            <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
              <p className="text-sm md:text-senior-base">{displayError}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl"
            disabled={isLoading || !senhasConferem}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Alterando...
              </>
            ) : (
              "Alterar Senha"
            )}
          </Button>
        </form>
      </CardContent>
    </>
  );
}
