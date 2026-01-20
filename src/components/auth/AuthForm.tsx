import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";

export function AuthForm() {
  const { signIn, signUp } = useAuthContext();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerNome, setRegisterNome] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerCelular, setRegisterCelular] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(loginEmail, loginPassword);
      toast({
        title: "Bem-vindo de volta!",
        description: "Login realizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: error.message || "Verifique seus dados e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas são iguais.",
        variant: "destructive",
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await signUp(registerEmail, registerPassword, registerNome, registerCelular);
      toast({
        title: "Cadastro realizado!",
        description: "Sua conta foi criada com sucesso. Bem-vindo!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível criar sua conta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCelular = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-senior-2xl text-primary">
          🍀 Lotofácil Inteligente
        </CardTitle>
        <CardDescription className="text-senior-base text-muted-foreground">
          Sua comunidade de apostadores
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 text-lg">
            <TabsTrigger value="login" className="text-senior-base">
              Entrar
            </TabsTrigger>
            <TabsTrigger value="register" className="text-senior-base">
              Cadastrar
            </TabsTrigger>
          </TabsList>

          {/* LOGIN TAB */}
          <TabsContent value="login" className="mt-6">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-senior-base flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  E-mail
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="input-senior"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-senior-base flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="input-senior pr-12"
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

              <Button
                type="submit"
                className="w-full btn-senior bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* REGISTER TAB */}
          <TabsContent value="register" className="mt-6">
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="register-nome" className="text-senior-base flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Nome Completo
                </Label>
                <Input
                  id="register-nome"
                  type="text"
                  placeholder="Seu nome"
                  value={registerNome}
                  onChange={(e) => setRegisterNome(e.target.value)}
                  required
                  className="input-senior"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-senior-base flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  E-mail
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  className="input-senior"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-celular" className="text-senior-base flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Celular
                </Label>
                <Input
                  id="register-celular"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={registerCelular}
                  onChange={(e) => setRegisterCelular(formatCelular(e.target.value))}
                  className="input-senior"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-senior-base flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                    className="input-senior pr-12"
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
                <Label htmlFor="register-confirm" className="text-senior-base flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Confirmar Senha
                </Label>
                <Input
                  id="register-confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  required
                  className="input-senior"
                />
              </div>

              <Button
                type="submit"
                className="w-full btn-senior bg-accent hover:bg-accent/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
