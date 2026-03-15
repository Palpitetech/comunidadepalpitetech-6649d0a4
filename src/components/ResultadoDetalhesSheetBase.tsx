import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Premiacao {
  faixa: number;
  descricao: string;
  ganhadores: number;
  valorPremio: number;
}

interface LocalGanhador {
  cidade: string;
  estado: string;
  ganhadores: number;
}

interface ResultadoDetalhesSheetBaseProps {
  open: boolean;
  onClose: () => void;
  resultado: any;
  loteria: "lotofacil" | "megasena" | "duplasena" | "quina" | "lotomania" | "diadesorte";
}

const LOTERIA_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  lotofacil: { label: "Lotofácil", color: "text-primary", bgColor: "bg-primary/10" },
  megasena: { label: "Mega-Sena", color: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  duplasena: { label: "Dupla Sena", color: "text-orange-600", bgColor: "bg-orange-500/10" },
  quina: { label: "Quina", color: "text-purple-600", bgColor: "bg-purple-500/10" },
  lotomania: { label: "Lotomania", color: "text-red-600", bgColor: "bg-red-500/10" },
  diadesorte: { label: "Dia de Sorte", color: "text-green-600", bgColor: "bg-green-500/10" },
};

const DEZENA_STYLES: Record<string, string> = {
  lotofacil: "bg-primary/15 text-primary",
  megasena: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  duplasena: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  quina: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  lotomania: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  diadesorte: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

function formatarMoeda(valor: number): string {
  if (valor >= 1_000_000) {
    return `R$ ${(valor / 1_000_000).toFixed(1).replace(".", ",")} Mi`;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: valor >= 1000 ? 0 : 2,
    maximumFractionDigits: valor >= 1000 ? 0 : 2,
  }).format(valor);
}

function getConcursoId(resultado: any): number {
  return resultado.concurso_id ?? resultado.concurso ?? 0;
}

function getDezenas(resultado: any, loteria: string): (string | number)[][] {
  if (loteria === "duplasena") {
    return [
      resultado.dezenas_sorteio1 || [],
      resultado.dezenas_sorteio2 || [],
    ];
  }
  return [resultado.dezenas || []];
}

export function ResultadoDetalhesSheetBase({
  open,
  onClose,
  resultado,
  loteria,
}: ResultadoDetalhesSheetBaseProps) {
  if (!resultado) return null;

  const config = LOTERIA_CONFIG[loteria] || LOTERIA_CONFIG.lotofacil;
  const concursoId = getConcursoId(resultado);
  const dezenasGroups = getDezenas(resultado, loteria);
  const dezenaStyle = DEZENA_STYLES[loteria] || DEZENA_STYLES.lotofacil;

  const dataFormatada = (() => {
    try {
      return format(parseISO(resultado.data_sorteio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return resultado.data_sorteio;
    }
  })();

  const premiacoes = (resultado.premiacao_json as Premiacao[] | null) || [];
  const locaisGanhadores = (resultado.locais_ganhadores as LocalGanhador[] | null) || [];

  // Pares/ímpares
  const pares = resultado.qtd_pares ?? resultado.qtd_pares_s1 ?? null;
  const impares = resultado.qtd_impares ?? resultado.qtd_impares_s1 ?? null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-4 border-b border-border/50">
          <SheetTitle className="text-xl">
            Concurso #{concursoId}
          </SheetTitle>
          <p className="text-base text-muted-foreground">{dataFormatada}</p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className={cn("text-xs", config.color, config.bgColor)}>
              {config.label}
            </Badge>
            {resultado.acumulou && (
              <Badge variant="destructive" className="text-xs">
                ACUMULOU
              </Badge>
            )}
            {loteria === "diadesorte" && resultado.mes_sorte && (
              <Badge variant="secondary" className="text-xs">
                📅 {resultado.mes_sorte}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-140px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Dezenas Sorteadas */}
            {dezenasGroups.map((dezenas, groupIdx) => (
              <section key={groupIdx}>
                <h3 className="text-base font-semibold mb-3">
                  {loteria === "duplasena"
                    ? `${groupIdx === 0 ? "1º" : "2º"} Sorteio`
                    : "Dezenas Sorteadas"}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {dezenas.map((dezena, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "w-[32px] h-[32px] rounded-full flex items-center justify-center",
                        "text-sm font-semibold",
                        dezenaStyle
                      )}
                    >
                      {String(dezena).padStart(2, "0")}
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {/* Indicadores */}
            <section>
              <h3 className="text-base font-semibold mb-3">📊 Indicadores</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {dezenasGroups[0].length} dezenas
                </Badge>
                {pares !== null && (
                  <Badge variant="outline" className="text-xs">
                    Pares: {pares}
                  </Badge>
                )}
                {impares !== null && (
                  <Badge variant="outline" className="text-xs">
                    Ímpares: {impares}
                  </Badge>
                )}
              </div>
            </section>

            {/* Premiação */}
            <section>
              <h3 className="text-base font-semibold mb-3">💰 Premiação</h3>
              {premiacoes.length > 0 ? (
                <div className="space-y-2">
                  {premiacoes.map((premio, idx) => {
                    const isOuro = idx < 2;
                    return (
                      <div
                        key={premio.faixa}
                        className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          {isOuro && (
                            <span className="text-xs">🥇</span>
                          )}
                          <div>
                            <span className="font-medium text-sm">
                              {premio.descricao}
                            </span>
                            <span className="text-muted-foreground text-xs ml-2">
                              ({premio.ganhadores} ganhador{premio.ganhadores !== 1 ? "es" : ""})
                            </span>
                          </div>
                        </div>
                        <span className={cn(
                          "font-semibold text-sm",
                          isOuro ? "text-yellow-600 dark:text-yellow-400" : "text-foreground"
                        )}>
                          {formatarMoeda(premio.valorPremio)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Premiação não disponível
                </p>
              )}
            </section>

            {/* Cidades ganhadoras */}
            <section>
              <h3 className="text-base font-semibold mb-3">📍 Ganhadores</h3>
              {locaisGanhadores.length > 0 ? (
                <div className="space-y-2">
                  {locaisGanhadores.map((local, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
                    >
                      <span className="text-sm">
                        {local.cidade}, {local.estado}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {local.ganhadores} ganhador{local.ganhadores !== 1 ? "es" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum ganhador neste concurso.
                </p>
              )}
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
