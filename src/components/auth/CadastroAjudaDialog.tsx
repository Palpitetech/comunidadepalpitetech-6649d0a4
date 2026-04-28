import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, Mail, MessageCircle, ShieldCheck, Clock, AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  etapa: "email" | "codigo-email" | "whatsapp" | "codigo-whatsapp" | "nome-senha";
}

export function CadastroAjudaDialog({ etapa }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Não recebi o código / Preciso de ajuda
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Como funciona a verificação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* Resumo do fluxo */}
          <section className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
            <p className="font-semibold text-foreground">Você recebe 2 códigos diferentes:</p>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p>
                <strong>1º código — por E-MAIL</strong> (caixa de entrada do endereço informado).
              </p>
            </div>
            <div className="flex items-start gap-2">
              <MessageCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <p>
                <strong>2º código — por WHATSAPP</strong> (mensagem direta no número informado, NÃO é SMS).
              </p>
            </div>
          </section>

          {/* Etapa atual destacada */}
          {(etapa === "email" || etapa === "codigo-email") && (
            <section className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> Sobre o código por e-mail
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Chega em até <strong>1 minuto</strong> no e-mail informado.</li>
                <li>Verifique também as pastas <strong>Spam</strong>, <strong>Promoções</strong> e <strong>Lixo eletrônico</strong>.</li>
                <li>Remetente: <strong>Palpite Tech</strong>.</li>
                <li>O código tem <strong>6 dígitos</strong> e expira em <strong>10 minutos</strong>.</li>
                <li>Após 5 tentativas erradas, o código é bloqueado — peça um novo.</li>
              </ul>
            </section>
          )}

          {(etapa === "whatsapp" || etapa === "codigo-whatsapp") && (
            <section className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-600" /> Sobre o código por WhatsApp
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Enviado <strong>pelo WhatsApp</strong>, não é SMS da operadora.</li>
                <li>O número precisa ter o <strong>WhatsApp ativo</strong> no aparelho.</li>
                <li>Use DDD + número (ex.: <strong>(11) 99999-9999</strong>).</li>
                <li>Chega em até <strong>1 minuto</strong>; verifique notificações silenciadas.</li>
                <li>O código tem <strong>6 dígitos</strong> e expira em <strong>10 minutos</strong>.</li>
              </ul>
            </section>
          )}

          {/* Estados esperados */}
          <section className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Estados que você pode ver
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2 rounded-md border border-border p-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Enviando / Verificando</p>
                  <p className="text-muted-foreground text-xs">Aguarde alguns segundos sem fechar a tela.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/5 p-2">
                <ShieldCheck className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-success-foreground">Confirmado</p>
                  <p className="text-muted-foreground text-xs">Avançamos automaticamente para a próxima etapa.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-destructive">Código incorreto / expirado / bloqueado</p>
                  <p className="text-muted-foreground text-xs">
                    Toque em <strong>Reenviar código</strong> para receber um novo (cooldown de 60s).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-md border border-border p-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Reenviar código</p>
                  <p className="text-muted-foreground text-xs">
                    Disponível após 60 segundos. Use somente se o código não chegar.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Suporte */}
          <section className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1">
            <p className="font-semibold">Ainda com problemas?</p>
            <p className="text-muted-foreground text-xs">
              Fale com o nosso suporte no WhatsApp:{" "}
              <a
                href="https://wa.me/5511910478800"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium underline"
              >
                (11) 91047-8800
              </a>
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
