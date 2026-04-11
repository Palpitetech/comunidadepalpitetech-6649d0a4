import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, User, MessageCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Etapa = "login" | "cadastro" | "completar-perfil";

export function LoginWizard() {
  const [etapa, setEtapa] = useState<Etapa>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, updateProfile, profile } = useAuthContext();

  const supportWhatsApp = "https://wa.me/5516997175392";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLimpo = email.trim().toLowerCase();
    
    if (!emailLimpo || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu e-mail e senha.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await signIn(emailLimpo, password);
      toast({
        title: "Sucesso!",
        description: "Você está logado.",
      });
      // Se já tiver nome, o useEffect no Auth.tsx redireciona
      // Mas podemos forçar aqui se o profile já estiver carregado
      if (profile?.nome) {
        navigate("/home", { replace: true });
      } else {
        setEtapa("completar-perfil");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "E-mail ou senha incorretos";
      toast({ title: "Erro no login", description: "Verifique seus dados e tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLimpo = email.trim().toLowerCase();
    
    if (!emailLimpo || !password || !nome.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await signUp(emailLimpo, password, nome.trim());
      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu e-mail para confirmar a conta (se necessário).",
      });
      // O profile pode demorar para atualizar, mas o signUp já deve logar se não houver confirmação de e-mail
      navigate("/home", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível realizar o cadastro";
      toast({ title: "Erro no cadastro", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setIsLoading(true);
    try {
      await updateProfile({ nome: nome.trim() });
      toast({ title: "Perfil atualizado!", description: "Bem-vindo ao Palpite Tech." });
      navigate("/home", { replace: true });
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível salvar seu nome.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Se já tiver perfil com nome, redireciona
  if (etapa === "completar-perfil" && profile?.nome) {
    navigate("/home", { replace: true });
    return null;
  }

  return (
    <Card className="w-full max-w-lg shadow-none border-0 md:shadow-xl md:border">
      {etapa === "login" && (
        <>
          <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
            <CardTitle className="text-xl md:text-senior-2xl">Acessar Conta</CardTitle>
            <CardDescription className="text-sm md:text-senior-base">
              Digite seus dados para entrar na plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="email" className="text-sm md:text-senior-base flex items-center gap-2">
                  <Mail className="h-4 w-4 md:h-5 md:w-5" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="password" className="text-sm md:text-senior-base flex items-center gap-2">
                  <Lock className="h-4 w-4 md:h-5 md:w-5" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setEtapa("cadastro")}
                  className="text-primary hover:text-primary/80"
                >
                  Não tem uma conta? Cadastre-se
                </Button>
                
                <a
                  href={supportWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-sm md:text-senior-base text-[#25D366] hover:text-[#25D366]/80 h-10 md:h-12 px-4 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                  Preciso de Suporte
                </a>
              </div>
            </form>
          </CardContent>
        </>
      )}

      {etapa === "cadastro" && (
        <>
          <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
            <CardTitle className="text-xl md:text-senior-2xl">Criar Conta</CardTitle>
            <CardDescription className="text-sm md:text-senior-base">
              Preencha os dados abaixo para se cadastrar.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <form onSubmit={handleCadastro} className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="reg-nome" className="text-sm md:text-senior-base flex items-center gap-2">
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                  Nome Completo
                </Label>
                <Input
                  id="reg-nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="reg-email" className="text-sm md:text-senior-base flex items-center gap-2">
                  <Mail className="h-4 w-4 md:h-5 md:w-5" />
                  E-mail
                </Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="reg-password" className="text-sm md:text-senior-base flex items-center gap-2">
                  <Lock className="h-4 w-4 md:h-5 md:w-5" />
                  Senha
                </Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                  minLength={6}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Criando conta...
                  </>
                ) : (
                  "Criar Conta"
                )}
              </Button>

              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setEtapa("login")}
                  className="text-primary hover:text-primary/80"
                >
                  Já tem uma conta? Faça login
                </Button>
              </div>
            </form>
          </CardContent>
        </>
      )}

      {etapa === "completar-perfil" && (
        <>
          <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
            <CardTitle className="text-xl md:text-senior-2xl">Quase lá!</CardTitle>
            <CardDescription className="text-sm md:text-senior-base">
              Como podemos te chamar?
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <form onSubmit={handleCompletarPerfil} className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="nome" className="text-sm md:text-senior-base">
                  Seu Nome
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                  autoFocus
                  required
                />
              </div>

              <Button type="submit" className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" disabled={isLoading || !nome.trim()}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Concluir Cadastro"
                )}
              </Button>
            </form>
          </CardContent>
        </>
      )}
    </Card>
  );
}
