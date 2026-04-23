import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, ShieldAlert, Loader2, ArrowLeft, MessageCircle } from "lucide-react";
import { formatCelularMask } from "@/lib/celular";

type Status = "idle" | "checking" | "verified" | "not_verified" | "invalid" | "error";

const SUPPORT_NUMBER = "5551981854281"; // contato oficial (mem://support/contact-info)

export default function VerificarWhatsApp() {
  const [numero, setNumero] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (status === "checking") return;
    setStatus("checking");
    try {
      const { data, error } = await supabase.functions.invoke("verify-whatsapp-number", {
        body: { numero },
      });
      if (error) {
        setStatus("error");
        return;
      }
      if (!data?.ok) {
        setStatus("error");
        return;
      }
      if (data.reason === "invalid_format") {
        setStatus("invalid");
        return;
      }
      setStatus(data.verified ? "verified" : "not_verified");
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setNumero("");
    setStatus("idle");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header simples */}
      <header className="border-b bg-card">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-semibold">Verificar WhatsApp Oficial</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Intro */}
          <div className="space-y-2 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Esse número é da Palpite Tech?</h2>
            <p className="text-sm text-muted-foreground">
              Cuidado com golpes. Digite o número que recebeu mensagem para confirmar se é oficial.
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleCheck} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="numero" className="text-sm font-medium">
                    Número de WhatsApp
                  </label>
                  <Input
                    id="numero"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(11) 99999-9999"
                    value={numero}
                    onChange={(e) => {
                      setNumero(formatCelularMask(e.target.value));
                      if (status !== "idle" && status !== "checking") setStatus("idle");
                    }}
                    disabled={status === "checking"}
                    className="h-12 text-base"
                    maxLength={16}
                    aria-label="Digite o número de WhatsApp para verificar"
                  />
                  <p className="text-xs text-muted-foreground">
                    Inclua DDD. Exemplo: (11) 99999-9999
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={!numero || status === "checking"}
                >
                  {status === "checking" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar agora"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resultado */}
          {status === "verified" && (
            <Card className="border-2 border-success bg-success/5">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                  <ShieldCheck className="h-9 w-9 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-success">Número OFICIAL ✓</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pode confiar — esse número pertence à Palpite Tech.
                  </p>
                </div>
                <Button variant="outline" onClick={reset} className="w-full">
                  Verificar outro número
                </Button>
              </CardContent>
            </Card>
          )}

          {status === "not_verified" && (
            <Card className="border-2 border-destructive bg-destructive/5">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
                  <ShieldAlert className="h-9 w-9 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-destructive">Não é nosso número ⚠️</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esse número <strong>não pertence</strong> à Palpite Tech. Não envie dados pessoais, senhas, códigos ou faça pagamentos.
                  </p>
                </div>
                <a
                  href={`https://wa.me/${SUPPORT_NUMBER}?text=${encodeURIComponent(
                    "Olá! Recebi mensagem de um número e quero confirmar se é golpe.",
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar com suporte oficial
                </a>
                <Button variant="outline" onClick={reset} className="w-full">
                  Verificar outro número
                </Button>
              </CardContent>
            </Card>
          )}

          {status === "invalid" && (
            <Card className="border-warning/40 bg-warning/5">
              <CardContent className="pt-6 text-center">
                <p className="text-sm">
                  Número inválido. Confira se digitou DDD + número corretos.
                </p>
              </CardContent>
            </Card>
          )}

          {status === "error" && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="pt-6 text-center space-y-3">
                <p className="text-sm">
                  Não conseguimos verificar agora. Tente novamente em instantes.
                </p>
                <Button variant="outline" size="sm" onClick={reset}>
                  Tentar de novo
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Dicas de segurança */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6 space-y-3">
              <h3 className="text-sm font-semibold">Dicas para evitar golpes:</h3>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Nunca compartilhe códigos de verificação por WhatsApp.</li>
                <li>A Palpite Tech <strong>nunca pede dados de cartão</strong> por mensagem.</li>
                <li>Em dúvida, sempre verifique o número aqui antes de responder.</li>
                <li>Pagamentos só pelo site oficial.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t py-4 px-4 text-center text-xs text-muted-foreground">
        Palpite Tech — Verificação oficial de números
      </footer>
    </div>
  );
}
