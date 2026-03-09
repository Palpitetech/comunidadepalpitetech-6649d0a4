import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gem, ArrowRight, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureLabel?: string;
  variant?: "premium" | "vip";
}

export function UpgradeModal({ open, onOpenChange, featureLabel, variant = "premium" }: UpgradeModalProps) {
  const isVip = variant === "vip";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3 pb-2">
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-2xl ${isVip ? "bg-[hsl(var(--vip))]/15" : "bg-[hsl(var(--premium))]/15"}`}>
            <Gem className={`h-8 w-8 ${isVip ? "text-[hsl(var(--vip))]" : "text-[hsl(var(--premium))]"}`} />
          </div>
          <DialogTitle className="text-xl font-bold">
            {isVip ? "Recurso Exclusivo VIP" : "Recurso Premium"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground text-sm text-center">
            {featureLabel
              ? <><strong className="text-foreground">{featureLabel}</strong> é um recurso {isVip ? "exclusivo do plano Anual VIP" : "disponível nos planos pagos"}.</>
              : <>Este recurso {isVip ? "é exclusivo do plano Anual VIP" : "está disponível nos planos pagos"}.</>
            }
          </p>

          <div className="bg-secondary/50 rounded-xl p-4 space-y-2.5">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {isVip ? "✨ Anual VIP inclui" : "⭐ Planos pagos incluem"}
            </p>
            {(isVip
              ? [
                  "Gerador Ilimitado",
                  "Chat IA completo",
                  "Ferramentas com IA exclusivas",
                  "Tudo dos outros planos",
                ]
              : [
                  "Gerador de Jogos",
                  "Fechamento e Desdobramento",
                  "Estatísticas completas",
                  "Comunidade e Mesa Redonda",
                ]
            ).map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button className="w-full gap-2" size="lg" asChild>
              <Link to="/planos" onClick={() => onOpenChange(false)}>
                <Sparkles className="h-4 w-4" />
                Ver Planos e Fazer Upgrade
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => onOpenChange(false)}>
              Agora não
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
