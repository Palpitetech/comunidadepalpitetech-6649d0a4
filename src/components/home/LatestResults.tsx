import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, Calendar, ChevronRight } from "lucide-react";

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

const latestLotteryResults: LotteryResult[] = [
  {
    id: "megasena",
    name: "Mega-Sena",
    color: "#209869",
    concurso: "2700",
    dataSorteio: "14/03/2024",
    dezenas: ["01", "11", "19", "20", "28", "37"],
    valorEstimado: "R$ 50.000.000,00",
    acumulado: true,
    proximoSorteio: "16/03/2024",
    proximoDiaSemana: "Sábado",
    proximoConcurso: "2701"
  },
  {
    id: "lotofacil",
    name: "Lotofácil",
    color: "#930989",
    concurso: "3053",
    dataSorteio: "14/03/2024",
    dezenas: ["01", "02", "03", "04", "05", "07", "08", "10", "12", "13", "14", "18", "19", "20", "23"],
    valorEstimado: "R$ 1.700.000,00",
    acumulado: false,
    proximoSorteio: "15/03/2024",
    proximoDiaSemana: "Sexta-feira",
    proximoConcurso: "3054"
  },
  {
    id: "quina",
    name: "Quina",
    color: "#260085",
    concurso: "6389",
    dataSorteio: "14/03/2024",
    dezenas: ["15", "23", "36", "41", "78"],
    valorEstimado: "R$ 2.400.000,00",
    acumulado: true,
    proximoSorteio: "15/03/2024",
    proximoDiaSemana: "Sexta-feira",
    proximoConcurso: "6390"
  },
  {
    id: "duplasena",
    name: "Dupla Sena",
    color: "#a61324",
    concurso: "2641",
    dataSorteio: "14/03/2024",
    dezenas: ["02", "11", "23", "29", "36", "47"],
    valorEstimado: "R$ 3.500.000,00",
    acumulado: true,
    proximoSorteio: "16/03/2024",
    proximoDiaSemana: "Sábado",
    proximoConcurso: "2642"
  },
  {
    id: "lotomania",
    name: "Lotomania",
    color: "#f7941d",
    concurso: "2597",
    dataSorteio: "13/03/2024",
    dezenas: ["01", "05", "12", "18", "22", "27", "33", "39", "44", "48", "52", "57", "61", "66", "72", "78", "84", "89", "93", "99"],
    valorEstimado: "R$ 4.200.000,00",
    acumulado: true,
    proximoSorteio: "15/03/2024",
    proximoDiaSemana: "Sexta-feira",
    proximoConcurso: "2598"
  },
  {
    id: "diadesorte",
    name: "Dia de Sorte",
    color: "#cb812b",
    concurso: "887",
    dataSorteio: "14/03/2024",
    dezenas: ["03", "07", "12", "18", "21", "25", "30"],
    valorEstimado: "R$ 1.200.000,00",
    acumulado: false,
    proximoSorteio: "16/03/2024",
    proximoDiaSemana: "Sábado",
    proximoConcurso: "888"
  }
];

export function LatestResults() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStudyClick = (lotteryId: string) => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      // Direct to specific hub or results if hub doesn't exist
      const hubPaths: Record<string, string> = {
        megasena: "/megasena",
        lotofacil: "/lotofacil",
        quina: "/quina",
        duplasena: "/duplasena",
        lotomania: "/lotomania/resultados",
        diadesorte: "/diadesorte/resultados"
      };
      
      navigate(hubPaths[lotteryId] || `/${lotteryId}`);
    }
  };

  return (
    <div className="w-full space-y-3 px-4 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-senior-dark">Últimos Resultados</h2>
        <span className="text-xs text-muted-foreground font-medium">Ver todos</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {latestLotteryResults.map((result) => (
          <Card key={result.id} className="overflow-hidden border-none shadow-md bg-white">
            {/* Header with Lottery Color Accent */}
            <div 
              className="h-1 w-full" 
              style={{ backgroundColor: result.color }}
            />
            
            <div className="p-3 space-y-3">
              {/* Lottery Name and Contest Info */}
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

              {/* Result Balls */}
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

              {/* Footer Info: Next Draw and Estimated Value */}
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
                    <p className="text-[11px] font-bold text-senior-dark leading-tight">
                      {result.proximoSorteio} • {result.proximoDiaSemana}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      Concurso {result.proximoConcurso}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full h-10 rounded-xl font-bold text-white shadow-md transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 mt-2"
                style={{ backgroundColor: result.color }}
                onClick={() => handleStudyClick(result.id)}
              >
                Ver estudo completo
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
