import { useNavigate } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
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
}

export function ConfirmNavigationDialog({
  isOpen,
  onOpenChange,
  desdobramentoUrl,
}: ConfirmNavigationDialogProps) {
  const navigate = useNavigate();

  const handleGoToGenerator = () => {
    onOpenChange(false);
    navigate(desdobramentoUrl);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">Ir para o Desdobramento?</AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            Os filtros selecionados serão aplicados automaticamente no gerador.
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
          <AlertDialogCancel className="w-full gap-2">
            <X className="h-4 w-4" />
            Cancelar
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
