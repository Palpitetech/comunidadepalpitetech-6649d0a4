import { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Phone, ArrowLeft } from "lucide-react";

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
      <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
        <CardTitle className="text-xl md:text-senior-2xl">Recuperar Senha</CardTitle>
        <CardDescription className="text-sm md:text-senior-base">
          Digite seu email ou celular cadastrado para receber um código de recuperação.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-4 md:px-6">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="identificador" className="text-sm md:text-senior-base flex items-center gap-2">
              <Icon className="h-4 w-4 md:h-5 md:w-5" />
              Email ou Celular
            </Label>
            <Input
              id="identificador"
              type="text"
              placeholder="seu@email.com ou (11) 99999-9999"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 md:p-4 rounded-xl bg-destructive/10 text-destructive text-sm md:text-senior-base">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl"
            disabled={isLoading || !identificador.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Buscando...
              </>
            ) : (
              "Enviar Código"
            )}
          </Button>

          <div className="flex flex-col gap-2 md:gap-3 pt-1 md:pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onVoltar}
              className="w-full h-10 md:h-12 text-sm md:text-senior-base"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Voltar para o login
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  );
}
