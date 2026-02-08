import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDezenasporPosicaoDuplaSena } from "@/hooks/useDezenasporPosicaoDuplaSena";
import { cn } from "@/lib/utils";
import { Target, Hash, ChevronRight, Trophy } from "lucide-react";

export default function DezenasporPosicaoDuplaSena() {
  const [periodo, setPeriodo] = useState<number>(100);
  const [posicaoSelecionada, setPosicaoSelecionada] = useState<number | null>(null);
  const [sorteioAtivo, setSorteioAtivo] = useState<"1" | "2">("1");
  const { data, isLoading, error } = useDezenasporPosicaoDuplaSena(periodo);

  if (isLoading) {
    return (
      <MainLayout pageTitle="Dezenas por Posição">
        <div className="px-4 py-6 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout pageTitle="Dezenas por Posição">
        <div className="px-4 py-6">
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="py-8 text-center text-destructive">
              Erro ao carregar dados.
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const dadosSorteio = sorteioAtivo === "1" ? data.sorteio1 : data.sorteio2;
  const posicaoData = posicaoSelecionada 
    ? dadosSorteio.find(p => p.posicao === posicaoSelecionada) 
    : null;

  return (
    <MainLayout pageTitle="Dezenas por Posição">
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6 space-y-4 max-w-2xl mx-auto">
          {/* Controles */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col gap-4">
                {/* Período */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Período:</span>
                  <Select value={String(periodo)} onValueChange={(v) => setPeriodo(Number(v))}>
                    <SelectTrigger className="w-[150px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 concurso</SelectItem>
                      <SelectItem value="2">2 concursos</SelectItem>
                      <SelectItem value="3">3 concursos</SelectItem>
                      <SelectItem value="4">4 concursos</SelectItem>
                      <SelectItem value="5">5 concursos</SelectItem>
                      <SelectItem value="6">6 concursos</SelectItem>
                      <SelectItem value="7">7 concursos</SelectItem>
                      <SelectItem value="8">8 concursos</SelectItem>
                      <SelectItem value="9">9 concursos</SelectItem>
                      <SelectItem value="10">10 concursos</SelectItem>
                      <SelectItem value="15">15 concursos</SelectItem>
                      <SelectItem value="20">20 concursos</SelectItem>
                      <SelectItem value="25">25 concursos</SelectItem>
                      <SelectItem value="30">30 concursos</SelectItem>
                      <SelectItem value="50">50 concursos</SelectItem>
                      <SelectItem value="100">100 concursos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Toggle Sorteio */}
                <div className="flex rounded-lg p-1 bg-muted/50">
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      sorteioAtivo === "1"
                        ? "bg-duplasena-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => {
                      setSorteioAtivo("1");
                      setPosicaoSelecionada(null);
                    }}
                  >
                    Sorteio 1
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      sorteioAtivo === "2"
                        ? "bg-duplasena-primary text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => {
                      setSorteioAtivo("2");
                      setPosicaoSelecionada(null);
                    }}
                  >
                    Sorteio 2
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de Posições 3x2 */}
          <Card>
            <CardHeader className="py-3 bg-duplasena-primary/10">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-duplasena-primary" />
                Selecione uma Posição
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {dadosSorteio.map((posData) => (
                  <button
                    key={posData.posicao}
                    onClick={() => setPosicaoSelecionada(posData.posicao)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:scale-105",
                      posicaoSelecionada === posData.posicao
                        ? "bg-duplasena-primary text-white border-duplasena-primary shadow-lg"
                        : "bg-muted/50 text-foreground border-border hover:border-duplasena-primary/50"
                    )}
                  >
                    <Hash className="h-4 w-4 opacity-60 mb-1" />
                    <span className="text-2xl font-bold">
                      {String(posData.posicao).padStart(2, "0")}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detalhes da Posição Selecionada */}
          {posicaoData && (
            <Card className="border-duplasena-primary/30">
              <CardHeader className="py-3 bg-duplasena-primary/10">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-duplasena-primary" />
                  Top 5 da Posição {String(posicaoData.posicao).padStart(2, "0")} - Sorteio {sorteioAtivo}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {posicaoData.top5.map((dezena, idx) => (
                  <div 
                    key={dezena.dezena}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      idx === 0 && "bg-duplasena-primary/10 border-duplasena-primary/30",
                      idx === 1 && "bg-duplasena-primary/7 border-duplasena-primary/20",
                      idx >= 2 && "bg-muted/30 border-border/50"
                    )}
                  >
                    {/* Ranking Badge */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                      idx === 0 && "bg-duplasena-primary text-white",
                      idx === 1 && "bg-duplasena-primary/80 text-white",
                      idx === 2 && "bg-duplasena-primary/60 text-white",
                      idx === 3 && "bg-duplasena-primary/40 text-white",
                      idx === 4 && "bg-duplasena-primary/30 text-foreground"
                    )}>
                      {idx + 1}º
                    </div>

                    {/* Dezena */}
                    <div className="w-11 h-11 rounded-xl bg-duplasena-primary text-white flex items-center justify-center font-bold text-lg">
                      {String(dezena.dezena).padStart(2, "0")}
                    </div>

                    {/* Stats */}
                    <div className="flex-1 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs text-muted-foreground">Frequência</div>
                        <div className="text-base font-bold">{dezena.frequencia}%</div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="text-xs text-muted-foreground">Ocorrências</div>
                        <div className="text-base font-bold">{dezena.quantidade}x</div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Insight */}
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <p>
                    Na <strong>posição {posicaoData.posicao}</strong> do <strong>Sorteio {sorteioAtivo}</strong>, a dezena{" "}
                    <strong className="text-duplasena-primary">
                      {String(posicaoData.top5[0]?.dezena).padStart(2, "0")}
                    </strong>{" "}
                    apareceu em <strong>{posicaoData.top5[0]?.frequencia}%</strong> dos últimos{" "}
                    {periodo} concursos.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instrução inicial */}
          {!posicaoSelecionada && (
            <Card className="bg-muted/30">
              <CardContent className="py-6 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ChevronRight className="h-8 w-8" />
                  <p>Clique em uma posição para ver as dezenas mais frequentes</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legenda */}
          <Card className="bg-muted/30">
            <CardContent className="py-2.5">
              <div className="flex items-center justify-center gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-4 h-4 rounded-full bg-duplasena-primary"></span>
                  <span>1º</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-4 h-4 rounded-full bg-duplasena-primary/80"></span>
                  <span>2º</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-4 h-4 rounded-full bg-duplasena-primary/60"></span>
                  <span>3º</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-4 h-4 rounded-full bg-duplasena-primary/40"></span>
                  <span>4º</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-4 h-4 rounded-full bg-duplasena-primary/30"></span>
                  <span>5º</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
