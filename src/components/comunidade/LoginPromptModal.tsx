import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface LoginPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginPromptModal({ open, onOpenChange }: LoginPromptModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <img src="/logo.png" alt="Palpite Tech" className="mx-auto h-12 w-12 rounded-md" />
          <DialogTitle className="text-xl">
            Entre para continuar
          </DialogTitle>
          <DialogDescription className="text-base">
            Faça login para interagir com a comunidade, curtir posts e ver mais conteúdos!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            size="lg"
            className="w-full gap-2 text-base"
            onClick={() => navigate("/login", { state: { from: { pathname: window.location.pathname } } })}
          >
            <LogIn className="h-5 w-5" />
            Entrar na minha conta
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Não tem conta? Crie uma ao entrar!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
