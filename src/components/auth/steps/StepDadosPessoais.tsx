import { useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, ArrowRight, User, Mail, Phone, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface StepDadosPessoaisProps {
  formData: {
    nome: string;
    email: string;
    celular: string;
    password: string;
  };
  onFormDataChange: (data: Partial<StepDadosPessoaisProps["formData"]>) => void;
  onNext: () => Promise<void>;
  isLoading: boolean;
}

export function StepDadosPessoais({
  formData,
  onFormDataChange,
  onNext,
  isLoading,
}: StepDadosPessoaisProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCelular = (value: string) => {
    const numeros = value.replace(/\D/g, "");
    if (numeros.length <= 2) return numeros;
    if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 11) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
    }
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = "Digite seu nome completo";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Digite seu e-mail";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    const celularNumeros = formData.celular.replace(/\D/g, "");
    if (!celularNumeros) {
      newErrors.celular = "Digite seu celular";
    } else if (celularNumeros.length < 10 || celularNumeros.length > 11) {
      newErrors.celular = "Celular deve ter 10 ou 11 dígitos";
    }

    if (!formData.password) {
      newErrors.password = "Digite uma senha";
    } else if (formData.password.length < 8) {
      newErrors.password = "Senha deve ter no mínimo 8 caracteres";
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    if (!aceitouTermos) {
      newErrors.termos = "Você precisa aceitar os termos para continuar";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onNext();
    }
  };

  return (
    <>
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-senior-2xl">Criar sua conta</CardTitle>
        <CardDescription className="text-senior-base">
          Preencha seus dados para começar
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-senior-base font-medium flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Nome completo
            </Label>
            <Input
              id="nome"
              type="text"
              placeholder="Seu nome completo"
              value={formData.nome}
              onChange={(e) => onFormDataChange({ nome: e.target.value })}
              className="input-senior"
              disabled={isLoading}
            />
            {errors.nome && (
              <p className="text-destructive text-senior-sm">{errors.nome}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-senior-base font-medium flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => onFormDataChange({ email: e.target.value })}
              className="input-senior"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-destructive text-senior-sm">{errors.email}</p>
            )}
          </div>

          {/* Celular */}
          <div className="space-y-2">
            <Label htmlFor="celular" className="text-senior-base font-medium flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              Celular (para verificação)
            </Label>
            <Input
              id="celular"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.celular}
              onChange={(e) => onFormDataChange({ celular: formatCelular(e.target.value) })}
              className="input-senior"
              disabled={isLoading}
              inputMode="numeric"
            />
            {errors.celular && (
              <p className="text-destructive text-senior-sm">{errors.celular}</p>
            )}
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-senior-base font-medium flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Senha
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => onFormDataChange({ password: e.target.value })}
                className="input-senior pr-14"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-destructive text-senior-sm">{errors.password}</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-senior-base font-medium flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Confirmar senha
            </Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-senior"
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-senior-sm">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Consentimento LGPD */}
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="termos"
                checked={aceitouTermos}
                onCheckedChange={(checked) => setAceitouTermos(checked === true)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <label htmlFor="termos" className="text-senior-sm text-muted-foreground cursor-pointer leading-relaxed">
                Li e aceito os{" "}
                <a href="/termos" target="_blank" className="underline text-primary hover:text-primary/80">
                  Termos de Uso
                </a>
                {" "}e a{" "}
                <a href="/privacidade" target="_blank" className="underline text-primary hover:text-primary/80">
                  Política de Privacidade
                </a>
                . Autorizo o uso dos meus dados conforme descrito.
              </label>
            </div>
            {errors.termos && (
              <p className="text-destructive text-senior-sm">{errors.termos}</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="btn-senior w-full mt-8"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Criando conta...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </>
  );
}
