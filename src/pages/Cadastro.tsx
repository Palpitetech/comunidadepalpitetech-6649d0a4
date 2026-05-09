import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Mail, MessageCircle, ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatCelularMask, validateCelularBR } from "@/lib/celular";
import { getStoredAttribution } from "@/hooks/useUTM";
import { useAuthContext } from "@/contexts/AuthContext";
import { mapErroCodigo } from "@/lib/cadastroErros";
import { CadastroAjudaDialog } from "@/components/auth/CadastroAjudaDialog";

type Etapa = "email" | "codigo-email" | "whatsapp" | "codigo-whatsapp" | "nome-senha";
const ETAPAS: Etapa[] = ["email", "codigo-email", "whatsapp", "codigo-whatsapp", "nome-senha"];

interface MensagemStatus {
  tipo: "info" | "sucesso" | "erro" | null;
  texto: string;
}

export default function Cadastro() {
  const navigate = useNavigate();
  const { signIn } = useAuthContext();

  const [etapa, setEtapa] = useState<Etapa>("email");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<MensagemStatus>({ tipo: null, texto: "" });

  const [cadastroId, setCadastroId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailMascarado, setEmailMascarado] = useState("");
  const [codigoEmail, setCodigoEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [celularMascarado, setCelularMascarado] = useState("");
  const [codigoWhats, setCodigoWhats] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  // cooldown reenvio
  const [reenvioEmail, setReenvioEmail] = useState(0);
  const [reenvioWhats, setReenvioWhats] = useState(0);

  useEffect(() => {
    if (reenvioEmail > 0) {
      const t = setTimeout(() => setReenvioEmail((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [reenvioEmail]);
  useEffect(() => {
    if (reenvioWhats > 0) {
      const t = setTimeout(() => setReenvioWhats((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [reenvioWhats]);

  const passoAtual = ETAPAS.indexOf(etapa) + 1;
  const totalPassos = ETAPAS.length;

  function limparMsg() {
    setMsg({ tipo: null, texto: "" });
  }

  function handleBack() {
    limparMsg();
    const idx = ETAPAS.indexOf(etapa);
    if (idx <= 0) {
      navigate("/login");
      return;
    }
    // Não permite voltar depois de senha definida (não há etapa após)
    setEtapa(ETAPAS[idx - 1]);
  }

  // ===== Etapa 1: enviar código email =====
  async function enviarCodigoEmail() {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes("@") || e.length < 5) {
      setMsg({ tipo: "erro", texto: "Informe um e-mail válido." });
      return;
    }
    setLoading(true);
    setMsg({ tipo: "info", texto: "Enviando código para seu e-mail..." });
    try {
      const { data, error } = await supabase.functions.invoke("cadastro-iniciar-email", {
        body: { email: e, attribution: getStoredAttribution() ?? {} },
      });
      if (error || !data?.sucesso) {
        setMsg({
          tipo: "erro",
          texto: mapErroCodigo(data?.erro, data?.mensagem ?? error?.message, "Não foi possível enviar o código."),
        });
        return;
      }
      setCadastroId(data.cadastro_id);
      setEmailMascarado(data.destino_mascarado || e);
      setReenvioEmail(60);
      setEtapa("codigo-email");
      setMsg({ tipo: "sucesso", texto: `Código enviado para ${data.destino_mascarado}` });
    } catch (err) {
      setMsg({ tipo: "erro", texto: "Erro de conexão. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  async function reenviarEmail() {
    if (reenvioEmail > 0) return;
    await enviarCodigoEmail();
  }

  // ===== Etapa 2: verificar código email =====
  async function verificarCodigoEmail(code?: string) {
    const c = (code ?? codigoEmail).trim();
    if (!/^\d{6}$/.test(c)) {
      setMsg({ tipo: "erro", texto: "Informe o código de 6 dígitos." });
      return;
    }
    setLoading(true);
    setMsg({ tipo: "info", texto: "Verificando código..." });
    try {
      const { data, error } = await supabase.functions.invoke("cadastro-verificar-email", {
        body: { cadastro_id: cadastroId, codigo: c },
      });
      if (error || !data?.sucesso) {
        setMsg({ tipo: "erro", texto: mapErroCodigo(data?.erro, data?.mensagem) });
        return;
      }
      setMsg({ tipo: "sucesso", texto: "E-mail confirmado!" });
      setEtapa("whatsapp");
    } catch {
      setMsg({ tipo: "erro", texto: "Erro de conexão. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  // ===== Etapa 3: enviar código WhatsApp =====
  async function enviarCodigoWhats() {
    const v = validateCelularBR(celular);
    if (!v.ok || !v.normalized) {
      setMsg({ tipo: "erro", texto: v.reason ?? "Informe um WhatsApp válido." });
      return;
    }
    setLoading(true);
    setMsg({ tipo: "info", texto: "Enviando código no seu WhatsApp..." });
    try {
      const { data, error } = await supabase.functions.invoke("cadastro-iniciar-whatsapp", {
        body: { cadastro_id: cadastroId, celular: v.normalized },
      });
      // Caso especial: rate limit, mas o código anterior já foi enviado
      // e ainda é válido — avança para a tela de digitar o código.
      if (data?.ja_enviado) {
        setCelularMascarado(data.destino_mascarado || celular);
        setEtapa("codigo-whatsapp");
        setMsg({ tipo: "info", texto: data?.mensagem ?? "Código já enviado. Verifique seu WhatsApp." });
        return;
      }
      if (error || !data?.sucesso) {
        setMsg({
          tipo: "erro",
          texto: mapErroCodigo(data?.erro, data?.mensagem, "Não foi possível enviar o código."),
        });
        return;
      }
      setCelularMascarado(data.destino_mascarado || celular);
      setReenvioWhats(60);
      setEtapa("codigo-whatsapp");
      setMsg({ tipo: "sucesso", texto: `Código enviado para ${data.destino_mascarado}` });
    } catch {
      setMsg({ tipo: "erro", texto: "Erro de conexão. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  async function reenviarWhats() {
    if (reenvioWhats > 0) return;
    await enviarCodigoWhats();
  }

  // ===== Etapa 4: verificar código WhatsApp =====
  async function verificarCodigoWhats(code?: string) {
    const c = (code ?? codigoWhats).trim();
    if (!/^\d{6}$/.test(c)) {
      setMsg({ tipo: "erro", texto: "Informe o código de 6 dígitos." });
      return;
    }
    setLoading(true);
    setMsg({ tipo: "info", texto: "Verificando código..." });
    try {
      const { data, error } = await supabase.functions.invoke("cadastro-verificar-whatsapp", {
        body: { cadastro_id: cadastroId, codigo: c },
      });
      if (error || !data?.sucesso) {
        setMsg({ tipo: "erro", texto: mapErroCodigo(data?.erro, data?.mensagem) });
        return;
      }
      setMsg({ tipo: "sucesso", texto: "WhatsApp confirmado!" });
      setEtapa("nome-senha");
    } catch {
      setMsg({ tipo: "erro", texto: "Erro de conexão. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  // ===== Etapa 5: finalizar =====
  async function finalizarCadastro() {
    const n = nome.trim();
    if (n.length < 2) {
      setMsg({ tipo: "erro", texto: "Informe seu nome." });
      return;
    }
    if (senha.length < 8) {
      setMsg({ tipo: "erro", texto: "A senha precisa ter pelo menos 8 caracteres." });
      return;
    }
    setLoading(true);
    setMsg({ tipo: "info", texto: "Criando sua conta..." });
    try {
      const { data, error } = await supabase.functions.invoke("cadastro-finalizar", {
        body: { cadastro_id: cadastroId, nome: n, senha },
      });
      if (error || !data?.sucesso) {
        setMsg({ tipo: "erro", texto: data?.mensagem || data?.erro || "Erro ao criar conta." });
        return;
      }
      // Login automático
      try {
        await signIn(data.email, senha);
        toast.success("Conta criada com sucesso!");
        navigate("/home", { replace: true });
      } catch {
        toast.success("Conta criada! Faça login para entrar.");
        navigate("/login", { replace: true });
      }
    } catch {
      setMsg({ tipo: "erro", texto: "Erro de conexão. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Helmet>
        <title>Criar conta | Palpite Tech</title>
        <meta name="description" content="Crie sua conta no Palpite Tech em 5 passos. Verificação por e-mail e WhatsApp." />
      </Helmet>

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            disabled={loading}
            aria-label="Voltar"
            className="h-11 w-11"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">
              Passo {passoAtual} de {totalPassos}
            </p>
            <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(passoAtual / totalPassos) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-4">
        <Card className="w-full max-w-md mt-6 shadow-lg">
          <CardContent className="p-6 space-y-5">
            {/* Mensagem de status */}
            {msg.tipo && (
              <div
                role="status"
                aria-live="polite"
                className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                  msg.tipo === "sucesso"
                    ? "bg-success/10 text-success-foreground border border-success/30"
                    : msg.tipo === "erro"
                    ? "bg-destructive/10 text-destructive border border-destructive/30"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {msg.tipo === "sucesso" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                ) : msg.tipo === "erro" ? (
                  <AlertCircle className="h-5 w-5 shrink-0" />
                ) : (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                )}
                <span>{msg.texto}</span>
              </div>
            )}

            {/* Etapa 1 — Email */}
            {etapa === "email" && (
              <form onSubmit={(e) => { e.preventDefault(); enviarCodigoEmail(); }} className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-7 w-7 text-primary" />
                  </div>
                  <h1 className="text-xl font-bold">Qual é o seu e-mail?</h1>
                  <p className="text-sm text-muted-foreground">
                    Vamos enviar um código de 6 dígitos <strong>por e-mail</strong> para confirmar.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Depois pediremos seu WhatsApp em uma segunda etapa.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); limparMsg(); }}
                    disabled={loading}
                    className="h-12 text-base"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 text-base">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar código"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Já tem conta?{" "}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    Entrar
                  </Link>
                </p>
              </form>
            )}

            {/* Etapa 2 — Código Email */}
            {etapa === "codigo-email" && (
              <form onSubmit={(e) => { e.preventDefault(); verificarCodigoEmail(); }} className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-7 w-7 text-primary" />
                  </div>
                  <h1 className="text-xl font-bold">Confirme seu e-mail</h1>
                  <p className="text-sm text-muted-foreground">
                    Enviamos um código <strong>por e-mail</strong> para <strong>{emailMascarado}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Não chegou? Verifique <strong>Spam</strong> e <strong>Promoções</strong>. Pode levar até 1 minuto.
                  </p>
                </div>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={codigoEmail}
                    onChange={(v) => {
                      setCodigoEmail(v);
                      limparMsg();
                      if (v.length === 6) verificarCodigoEmail(v);
                    }}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" disabled={loading || codigoEmail.length !== 6} className="w-full h-12 text-base">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verificar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={reenviarEmail}
                  disabled={reenvioEmail > 0 || loading}
                  className="w-full"
                >
                  {reenvioEmail > 0 ? `Reenviar código em ${reenvioEmail}s` : "Reenviar código por e-mail"}
                </Button>
                <CadastroAjudaDialog etapa="codigo-email" />
              </form>
            )}

            {/* Etapa 3 — WhatsApp */}
            {etapa === "whatsapp" && (
              <form onSubmit={(e) => { e.preventDefault(); enviarCodigoWhats(); }} className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                    <MessageCircle className="h-7 w-7 text-green-600" />
                  </div>
                  <h1 className="text-xl font-bold">Qual é o seu WhatsApp?</h1>
                  <p className="text-sm text-muted-foreground">
                    Vamos enviar um código de 6 dígitos <strong>pelo WhatsApp</strong> (não é SMS).
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use um número com WhatsApp ativo neste aparelho ou em outro.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cel">WhatsApp (com DDD)</Label>
                  <Input
                    id="cel"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    autoFocus
                    placeholder="(11) 99999-9999"
                    value={celular}
                    onChange={(e) => { setCelular(formatCelularMask(e.target.value)); limparMsg(); }}
                    disabled={loading}
                    className="h-12 text-base"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 text-base">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar código no WhatsApp"}
                </Button>
                <CadastroAjudaDialog etapa="whatsapp" />
              </form>
            )}

            {/* Etapa 4 — Código WhatsApp */}
            {etapa === "codigo-whatsapp" && (
              <form onSubmit={(e) => { e.preventDefault(); verificarCodigoWhats(); }} className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                    <ShieldCheck className="h-7 w-7 text-green-600" />
                  </div>
                  <h1 className="text-xl font-bold">Confirme seu WhatsApp</h1>
                  <p className="text-sm text-muted-foreground">
                    Enviamos um código <strong>pelo WhatsApp</strong> para <strong>{celularMascarado}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Abra o app do WhatsApp e veja a mensagem do <strong>Palpite Tech</strong>.
                  </p>
                </div>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={codigoWhats}
                    onChange={(v) => {
                      setCodigoWhats(v);
                      limparMsg();
                      if (v.length === 6) verificarCodigoWhats(v);
                    }}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button type="submit" disabled={loading || codigoWhats.length !== 6} className="w-full h-12 text-base">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verificar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={reenviarWhats}
                  disabled={reenvioWhats > 0 || loading}
                  className="w-full"
                >
                  {reenvioWhats > 0 ? `Reenviar código em ${reenvioWhats}s` : "Reenviar código pelo WhatsApp"}
                </Button>
                <CadastroAjudaDialog etapa="codigo-whatsapp" />
              </form>
            )}

            {/* Etapa 5 — Nome + Senha */}
            {etapa === "nome-senha" && (
              <form onSubmit={(e) => { e.preventDefault(); finalizarCadastro(); }} className="space-y-4">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <h1 className="text-xl font-bold">Quase lá!</h1>
                  <p className="text-sm text-muted-foreground">
                    Defina seu nome e crie uma senha de acesso.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome">Seu nome</Label>
                  <Input
                    id="nome"
                    type="text"
                    autoComplete="name"
                    autoFocus
                    placeholder="Como podemos te chamar"
                    value={nome}
                    onChange={(e) => { setNome(e.target.value); limparMsg(); }}
                    disabled={loading}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha (mín. 8 caracteres)</Label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showSenha ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={senha}
                      onChange={(e) => { setSenha(e.target.value); limparMsg(); }}
                      disabled={loading}
                      className="h-12 text-base pr-20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenha((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-medium"
                    >
                      {showSenha ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 text-base">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (<><Lock className="h-4 w-4 mr-2" />Criar minha conta</>)}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Ao criar a conta você concorda com nossos{" "}
                  <Link to="/termos" className="underline">Termos</Link> e{" "}
                  <Link to="/privacidade" className="underline">Privacidade</Link>.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
