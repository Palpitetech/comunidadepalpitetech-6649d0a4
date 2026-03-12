import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, MessageCircle, Heart, Star } from "lucide-react";

interface LoginPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginPromptModal({ open, onOpenChange }: LoginPromptModalProps) {
  const navigate = useNavigate();

  const fromState = { state: { from: { pathname: window.location.pathname } } };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none gap-0">
        {/* Hero section */}
        <div className="bg-primary px-6 pt-8 pb-6 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-primary-foreground/5" />
          <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-primary-foreground/5" />

          <img
            src="/logo.png"
            alt="Palpite Tech"
            className="mx-auto h-16 w-16 rounded-xl shadow-lg border-2 border-primary-foreground/20 mb-4 relative z-10"
          />
          <h2 className="text-xl font-bold text-primary-foreground relative z-10">
            Faça parte da nossa comunidade gratuita!
          </h2>
          <p className="text-primary-foreground/80 text-sm mt-2 relative z-10">
            Cadastre-se sem custo e tenha acesso a análises, palpites e muito mais.
          </p>
        </div>

        {/* Benefits */}
        <div className="px-6 py-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Star className="h-4 w-4 text-accent" />
            </div>
            <p className="text-sm text-foreground">
              Acesse <strong>análises exclusivas</strong> dos nossos especialistas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <MessageCircle className="h-4 w-4 text-accent" />
            </div>
            <p className="text-sm text-foreground">
              Comente, tire dúvidas e <strong>interaja</strong> com a comunidade
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Heart className="h-4 w-4 text-accent" />
            </div>
            <p className="text-sm text-foreground">
              <strong>100% gratuito</strong> — sem cartão, sem compromisso
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2.5">
          <Button
            size="lg"
            className="w-full gap-2 text-base font-semibold"
            onClick={() => navigate("/login?tab=register", fromState)}
          >
            <UserPlus className="h-5 w-5" />
            Criar minha conta grátis
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 text-base"
            onClick={() => navigate("/login", fromState)}
          >
            <LogIn className="h-5 w-5" />
            Já tenho conta — Entrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
