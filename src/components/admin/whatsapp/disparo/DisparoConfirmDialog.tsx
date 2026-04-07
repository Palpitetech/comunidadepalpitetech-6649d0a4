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
import { Badge } from "@/components/ui/badge";

interface DisparoConfirmDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contactCount: number | null;
  activeFilters: string[];
  onConfirm: () => void;
}

export function DisparoConfirmDialog({
  open,
  onOpenChange,
  contactCount,
  activeFilters,
  onConfirm,
}: DisparoConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar disparo</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Você está prestes a enviar mensagem para{" "}
                <span className="font-semibold text-foreground">{contactCount}</span> contatos.
              </p>

              {activeFilters.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Filtros aplicados:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeFilters.map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <p>Confirmar?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirmar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
