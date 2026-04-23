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

// HSL tokens espelhando o GeradorTheme para manter identidade visual da loteria
const COLOR_BY_TAG: Record<string, { bg: string; hover: string }> = {
  "Lotofácil": {
    bg: "bg-[hsl(270_60%_50%)] text-white",
    hover: "hover:bg-[hsl(270_60%_45%)]",
  },
  "Mega-Sena": {
    bg: "bg-[hsl(125_70%_40%)] text-white",
    hover: "hover:bg-[hsl(125_70%_35%)]",
  },
};

export function GerarPalpitesDoEstudoButton({ postId, loteriaTag }: Props) {
  if (!loteriaTag) return null;
  const route = ROUTE_BY_TAG[loteriaTag];
  if (!route) return null;

  const colors = COLOR_BY_TAG[loteriaTag];

  return (
    <Button
      asChild
      className={`w-full ${colors?.bg ?? ""} ${colors?.hover ?? ""}`}
    >
      <Link to={`${route}?postId=${postId}`}>
        Gerar palpites com esse estudo
      </Link>
    </Button>
  );
}
