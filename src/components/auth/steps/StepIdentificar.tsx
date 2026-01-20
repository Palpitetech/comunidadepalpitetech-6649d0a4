import { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Mail, Phone, ArrowLeft } from "lucide-react";

interface StepIdentificarProps {
  isLoading: boolean;
  error: string | null;
  onBuscar: (identificador: string) => Promise<{ sucesso: boolean }>;
  onVoltar: () => void;
}

export function StepIdentificar({ isLoading, error, onBuscar, onVoltar }: StepIdentificarProps) {
  const [identificador, setIdentificador] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim()) return;
    await onBuscar(identificador.trim());
  };

  const isEmail = identificador.includes("@");
  const Icon = isEmail ? Mail : Phone;

  return (
    <>
      <CardHeader className="text-center pb-6">
        <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Search className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-senior-2xl">Recuperar Senha</CardTitle>
        <CardDescription className="text-senior-base">
          Digite seu email ou celular cadastrado para receber um código de recuperação.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="identificador" className="text-senior-base flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Email ou Celular
            </Label>
            <Input
              id="identificador"
              type="text"
              placeholder="seu@email.com ou (11) 99999-9999"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              className="input-senior"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-senior-base">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="btn-senior w-full"
            disabled={isLoading || !identificador.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Enviar Código
              </>
            )}
          </Button>

          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={onVoltar}
              className="w-full h-12 text-senior-base"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar para o login
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  );
}
