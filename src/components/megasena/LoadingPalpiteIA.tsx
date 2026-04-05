import { Loader2 } from "lucide-react";

interface LoadingPalpiteIAProps {
  isLoading: boolean;
}

export function LoadingPalpiteIA({ isLoading }: LoadingPalpiteIAProps) {
  if (!isLoading) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Gerando palpites com IA...</span>
    </div>
  );
}
