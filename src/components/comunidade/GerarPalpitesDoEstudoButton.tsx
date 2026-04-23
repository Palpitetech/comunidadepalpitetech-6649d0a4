import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Props {
  postId: string;
  tema: string | null;
  loteriaTag: string | null;
}

const ROUTE_BY_TAG: Record<string, string> = {
  "Lotofácil": "/lotofacil/gerador-estudo",
  "Mega-Sena": "/megasena/gerador-estudo",
};

export function GerarPalpitesDoEstudoButton({ postId, loteriaTag }: Props) {
  if (!loteriaTag) return null;
  const route = ROUTE_BY_TAG[loteriaTag];
  if (!route) return null;

  return (
    <Button
      asChild
      className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
    >
      <Link to={`${route}?postId=${postId}`}>
        <Sparkles className="h-4 w-4" />
        Gerar palpites com esse estudo
      </Link>
    </Button>
  );
}
