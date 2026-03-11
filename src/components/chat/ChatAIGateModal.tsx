import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { Link } from "react-router-dom";

interface ChatAIGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotteryName: string;
}

export function ChatAIGateModal({ open, onOpenChange, lotteryName }: ChatAIGateModalProps) {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const benefits = [
    "Análise estatística em tempo real",
    "Dados reais de todos os concursos",
    "Estratégias personalizadas",
    "Ciclos, moldura, pares e ímpares",
    "Direcionamento para a ferramenta certa",
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-3 pb-2">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-[hsl(var(--vip))]/15">
              <span className="text-3xl">🤖</span>
            </div>
            <DialogTitle className="text-xl font-bold">
              Desbloqueie a IA de Análise
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-muted-foreground text-sm text-center leading-relaxed">
              Converse com a IA mais avançada do mercado sobre{" "}
              <strong className="text-foreground">{lotteryName}</strong>. Análise de ciclos,
              padrões, frequências e estratégias com dados reais.
              <br />
              <span className="text-xs mt-1 block text-muted-foreground/80">
                Mais de 47.000 linhas de código trabalhando para o seu próximo palpite.
              </span>
            </p>

            <div className="bg-secondary/50 rounded-xl p-4 space-y-2.5">
              {benefits.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                className="w-full gap-2"
                size="lg"
                onClick={() => {
                  onOpenChange(false);
                  setUpgradeOpen(true);
                }}
              >
                <Sparkles className="h-4 w-4" />
                👑 Quero o Plano Anual VIP
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" asChild>
                <Link to="/planos" onClick={() => onOpenChange(false)}>
                  Ver planos
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureLabel="Chat IA de Análise"
        variant="vip"
      />
    </>
  );
}
