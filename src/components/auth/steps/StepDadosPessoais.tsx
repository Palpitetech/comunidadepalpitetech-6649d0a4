import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
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

    // Celular é opcional, mas se preenchido deve ser válido
    const celularNumeros = formData.celular.replace(/\D/g, "");
    if (celularNumeros && (celularNumeros.length < 10 || celularNumeros.length > 11)) {
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

  const inputClass = "h-10 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary";

  return (
    <div className="flex flex-col flex-1 px-4 md:px-6 pb-4 md:pb-6">
      <div className="text-center py-3 md:py-6">
        <h2 className="text-lg md:text-senior-2xl font-semibold tracking-tight">Criar sua conta</h2>
        <p className="text-xs md:text-senior-base text-muted-foreground mt-1">
          Preencha seus dados para começar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 space-y-2 md:space-y-5">
        {/* Nome */}
        <div className="space-y-0.5">
          <Label htmlFor="nome" className="text-xs md:text-senior-base font-medium">
            Nome completo
          </Label>
          <Input
            id="nome"
            type="text"
            placeholder="Seu nome completo"
            value={formData.nome}
            onChange={(e) => onFormDataChange({ nome: e.target.value })}
            className={inputClass}
            disabled={isLoading}
          />
          {errors.nome && <p className="text-destructive text-xs">{errors.nome}</p>}
        </div>

        {/* Email */}
        <div className="space-y-0.5">
          <Label htmlFor="email" className="text-xs md:text-senior-base font-medium">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => onFormDataChange({ email: e.target.value })}
            className={inputClass}
            disabled={isLoading}
          />
          {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
        </div>

        {/* Celular */}
        <div className="space-y-0.5">
          <Label htmlFor="celular" className="text-xs md:text-senior-base font-medium">
            Celular
          </Label>
          <Input
            id="celular"
            type="tel"
            placeholder="(11) 99999-9999"
            value={formData.celular}
            onChange={(e) => onFormDataChange({ celular: formatCelular(e.target.value) })}
            className={inputClass}
            disabled={isLoading}
            inputMode="numeric"
          />
          {errors.celular && <p className="text-destructive text-xs">{errors.celular}</p>}
        </div>

        {/* Senha */}
        <div className="space-y-0.5">
          <Label htmlFor="password" className="text-xs md:text-senior-base font-medium">
            Senha
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={formData.password}
              onChange={(e) => onFormDataChange({ password: e.target.value })}
              className={`${inputClass} pr-10 md:pr-14`}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
        </div>

        {/* Confirmar Senha */}
        <div className="space-y-0.5">
          <Label htmlFor="confirmPassword" className="text-xs md:text-senior-base font-medium">
            Confirmar senha
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Digite a senha novamente"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            disabled={isLoading}
          />
          {errors.confirmPassword && <p className="text-destructive text-xs">{errors.confirmPassword}</p>}
        </div>

        {/* Consentimento LGPD */}
        <div className="space-y-0.5">
          <div className="flex items-start gap-2 p-2 md:p-4 bg-muted/50 rounded-lg">
            <Checkbox
              id="termos"
              checked={aceitouTermos}
              onCheckedChange={(checked) => setAceitouTermos(checked === true)}
              disabled={isLoading}
              className="mt-0.5"
            />
            <label htmlFor="termos" className="text-[11px] md:text-senior-sm text-muted-foreground cursor-pointer leading-snug">
              Li e aceito os{" "}
              <a href="/termos" target="_blank" className="underline text-primary hover:text-primary/80">
                Termos de Uso
              </a>
              {" "}e a{" "}
              <a href="/privacidade" target="_blank" className="underline text-primary hover:text-primary/80">
                Política de Privacidade
              </a>.
            </label>
          </div>
          {errors.termos && <p className="text-destructive text-xs">{errors.termos}</p>}
        </div>

        <div className="mt-auto pt-2 md:pt-4">
          <Button 
            type="submit" 
            className="h-11 md:h-14 px-6 md:px-8 text-base md:text-lg font-semibold rounded-xl transition-all duration-200 w-full"
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
        </div>
      </form>
    </div>
  );
}
