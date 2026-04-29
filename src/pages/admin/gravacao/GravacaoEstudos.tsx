import { useParams, Link } from "react-router-dom";
import { ArrowLeft, BarChart3 } from "lucide-react";
import {
  TEMAS_POR_LOTERIA,
  LOTERIAS,
} from "@/components/gravacao/estudos/temasConfig";
import TemaGravacaoCard from "@/components/gravacao/estudos/TemaGravacaoCard";

export default function GravacaoEstudos() {
  const { loteria = "megasena" } = useParams<{ loteria: string }>();
  const cfg = LOTERIAS[loteria] || LOTERIAS.megasena;
  const temas = TEMAS_POR_LOTERIA[loteria] || [];
  const ativos = temas.filter((t) => t.status === "ativo").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base font-bold">
            Gravação Estudos · {cfg.nome}
          </h1>
          <span className="ml-auto text-xs text-muted-foreground">
            {ativos} {ativos === 1 ? "tema ativo" : "temas ativos"}
            {temas.length > ativos ? ` · ${temas.length - ativos} em breve` : ""}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="h-4 w-4" style={{ color: cfg.cor }} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Temas de gravação
          </h2>
        </div>

        {temas.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            <p className="font-medium">Nenhum tema configurado para {cfg.nome}.</p>
            <p className="text-xs mt-1">
              Adicione um tema em{" "}
              <code className="text-[11px] bg-muted px-1 py-0.5 rounded">
                src/components/gravacao/estudos/temasConfig.ts
              </code>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {temas.map((tema) => (
              <TemaGravacaoCard key={tema.slug} tema={tema} loteriaTag={cfg.tag} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
