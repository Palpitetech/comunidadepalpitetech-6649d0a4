import { useNavigate } from "react-router-dom";
import { ArrowRight, StickyNote } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmNavigationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  desdobramentoUrl: string;
  onContinueAnalysis: () => void;
}

export function ConfirmNavigationDialog({
  isOpen,
  onOpenChange,
  desdobramentoUrl,
  onContinueAnalysis,
}: ConfirmNavigationDialogProps) {
  const navigate = useNavigate();

  const handleGoToGenerator = () => {
    onOpenChange(false);
    navigate(desdobramentoUrl);
  };

  const handleContinueAnalysis = () => {
    onOpenChange(false);
    onContinueAnalysis();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">O que deseja fazer?</AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            Você pode ir ao gerador com os filtros selecionados ou continuar analisando.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogAction
            onClick={handleGoToGenerator}
            className="w-full gap-2 bg-highlight hover:bg-highlight/90 text-highlight-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            Ir para o Desdobramento
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={handleContinueAnalysis}
            className="w-full gap-2"
          >
            <StickyNote className="h-4 w-4" />
            Continuar Análise
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
