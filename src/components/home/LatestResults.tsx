import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, ChevronRight, Loader2 } from "lucide-react";
import { useLatestResults } from "@/hooks/useLatestResults";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LotteryResult {
  id: string;
  name: string;
  color: string;
  concurso: string;
  dataSorteio: string;
  dezenas: string[];
  valorEstimado: string;
  acumulado: boolean;
  proximoSorteio: string;
  proximoDiaSemana: string;
  proximoConcurso: string;
}

const lotteryConfig: Record<string, { name: string; color: string }> = {
  megasena: { name: "Mega-Sena", color: "#209869" },
  lotofacil: { name: "Lotofácil", color: "#930989" },
  quina: { name: "Quina", color: "#260085" },
  duplasena: { name: "Dupla Sena", color: "#a61324" },
  lotomania: { name: "Lotomania", color: "#f7941d" },
  diadesorte: { name: "Dia de Sorte", color: "#cb812b" },
};

export function LatestResults() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: latestResults, isLoading } = useLatestResults();

  const handleStudyClick = (lotteryId: string) => {
    const targetPath = `/${lotteryId}`;
    if (location.pathname === "/") {
      navigate(targetPath);
      return;
    }
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      navigate(targetPath);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const results: LotteryResult[] = (latestResults || []).map((r: any) => {
    const config = lotteryConfig[r.loteria] || { name: r.loteria, color: "#666" };
    const concurso = (r.concurso || r.concurso_id || 0).toString();

    // Prioriza dados de proximos_concursos; fallback para resultados_loterias
    const premioProximo = r.premio_estimado_proximo ?? r.valor_estimado_proximo ?? null;
    const dataProximoRaw = r.data_proximo_concurso_real ?? r.data_proximo_concurso ?? null;
    const numeroProximo = r.numero_proximo_concurso ?? (parseInt(concurso) + 1).toString();

    // Parse de data sem time-zone shift (yyyy-mm-dd → Date local)
    const parseLocalDate = (s: string | null) => {
      if (!s) return null;
      const [y, m, d] = s.split("-").map(Number);
      if (!y || !m || !d) return null;
      return new Date(y, m - 1, d);
    };

    const dataSorteioDate = parseLocalDate(r.data_sorteio);
    const dataProximoDate = parseLocalDate(dataProximoRaw);

    return {
      id: r.loteria,
      name: config.name,
      color: config.color,
      concurso,
      dataSorteio: dataSorteioDate ? format(dataSorteioDate, "dd/MM/yyyy") : "-",
      dezenas: (r.dezenas || []).map((d: number) => d.toString().padStart(2, "0")),
      valorEstimado: premioProximo
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(premioProximo)
        : "Aguardando...",
      acumulado: !!r.acumulou,
      proximoSorteio: dataProximoDate ? format(dataProximoDate, "dd/MM/yyyy") : "-",
      proximoDiaSemana: dataProximoDate
        ? format(dataProximoDate, "EEEE", { locale: ptBR })
        : "-",
      proximoConcurso: numeroProximo,
    };
  });

  return (
    <div className="w-full space-y-3 px-4 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-senior-dark">Últimos Resultados</h2>
        <span className="text-xs text-muted-foreground font-medium">Ver todos</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {results.map((result) => (
          <Card key={result.id} className="overflow-hidden border-none shadow-md bg-white">
            <div 
              className="h-1 w-full" 
              style={{ backgroundColor: result.color }}
            />
            
            <div className="p-3 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 
                    className="text-base font-black uppercase tracking-tight"
                    style={{ color: result.color }}
                  >
                    {result.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Concurso {result.concurso} • {result.dataSorteio}
                  </p>
                </div>
                {result.acumulado && (
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-none text-[10px] font-bold px-2 py-0 h-5">
                    ACUMULOU!
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {result.dezenas.map((dezena, idx) => (
                  <div 
                    key={idx}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: result.color }}
                  >
                    {dezena}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-dashed border-gray-100 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground font-medium line-clamp-2">Estimativa Próximo Concurso</span>
                  </div>
                  <span className="text-sm font-bold text-senior-dark">
                    {result.valorEstimado}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground font-medium">Próximo Sorteio</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-senior-dark leading-tight capitalize">
                      {result.proximoSorteio} • {result.proximoDiaSemana}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      Concurso {result.proximoConcurso}
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-10 rounded-xl font-bold text-white shadow-md transition-all sm:hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center mt-2 select-none touch-manipulation"
                style={{ backgroundColor: result.color }}
                onClick={() => handleStudyClick(result.id)}
              >
                Ver estudo completo
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

