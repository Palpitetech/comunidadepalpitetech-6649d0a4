import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DezenaCirculo } from "./DezenaCirculo";
import { IndicadorBadge } from "./IndicadorBadge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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

interface ResultadoCompleto {
  concurso_id: number;
  data_sorteio: string;
  dezenas: number[];
  qtd_pares: number | null;
  qtd_impares: number | null;
  qtd_moldura: number | null;
  qtd_primos: number | null;
  qtd_repetidas: number | null;
  acumulou: boolean | null;
  ciclo_numero: number | null;
  dezenas_faltantes_ciclo: number[] | null;
  premiacao_json: Premiacao[] | null;
  locais_ganhadores: LocalGanhador[] | null;
}

interface ResultadoDetalhesSheetProps {
  resultado: ResultadoCompleto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function ResultadoDetalhesSheet({
  resultado,
  open,
  onOpenChange,
}: ResultadoDetalhesSheetProps) {
  if (!resultado) return null;

  const dataFormatada = format(
    parseISO(resultado.data_sorteio),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  const premiacoes = resultado.premiacao_json as Premiacao[] | null;
  const locaisGanhadores = resultado.locais_ganhadores as LocalGanhador[] | null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-4 border-b border-border/50">
          <SheetTitle className="text-xl text-primary">
            Concurso #{resultado.concurso_id}
          </SheetTitle>
          <p className="text-base text-muted-foreground">{dataFormatada}</p>
          {resultado.acumulou && (
            <Badge variant="secondary" className="w-fit">
              Acumulou
            </Badge>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-120px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Dezenas Sorteadas */}
            <section>
              <h3 className="text-base font-semibold mb-3">Dezenas Sorteadas</h3>
              <div className="flex flex-wrap gap-2">
                {resultado.dezenas.map((dezena, index) => (
                  <DezenaCirculo
                    key={index}
                    dezena={dezena}
                    size="sm"
                    showMoldura={true}
                    showPrimo={true}
                  />
                ))}
              </div>
            </section>

            {/* Indicadores */}
            <section>
              <h3 className="text-base font-semibold mb-3">📊 Indicadores</h3>
              <div className="flex flex-wrap gap-2">
                <IndicadorBadge
                  label="Pares"
                  value={resultado.qtd_pares ?? 0}
                  tipo="pares"
                />
                <IndicadorBadge
                  label="Ímpares"
                  value={resultado.qtd_impares ?? 0}
                  tipo="impares"
                />
                <IndicadorBadge
                  label="Moldura"
                  value={resultado.qtd_moldura ?? 0}
                  tipo="moldura"
                />
                <IndicadorBadge
                  label="Primos"
                  value={resultado.qtd_primos ?? 0}
                  tipo="primos"
                />
                <IndicadorBadge
                  label="Repetidas"
                  value={resultado.qtd_repetidas ?? 0}
                  tipo="repetidas"
                />
              </div>
            </section>

            {/* Status do Ciclo */}
            {resultado.ciclo_numero && (
              <section>
                <h3 className="text-base font-semibold mb-3">🔄 Status do Ciclo</h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-base">
                    <span className="text-muted-foreground">Ciclo atual:</span>{" "}
                    <span className="font-semibold">#{resultado.ciclo_numero}</span>
                  </p>
                  {resultado.dezenas_faltantes_ciclo &&
                    resultado.dezenas_faltantes_ciclo.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-sm mb-2">
                          Faltam sair neste ciclo:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {resultado.dezenas_faltantes_ciclo.map((dezena) => (
                            <span
                              key={dezena}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10 text-destructive text-sm font-semibold"
                            >
                              {dezena.toString().padStart(2, "0")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </section>
            )}

            {/* Premiação por Faixa */}
            {premiacoes && premiacoes.length > 0 && (
              <section>
                <h3 className="text-base font-semibold mb-3">💰 Premiação por Faixa</h3>
                <div className="space-y-2">
                  {premiacoes.map((premio) => (
                    <div
                      key={premio.faixa}
                      className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
                    >
                      <div>
                        <span className="font-medium text-base">
                          {premio.descricao}
                        </span>
                        <span className="text-muted-foreground text-sm ml-2">
                          ({premio.ganhadores} ganhador{premio.ganhadores !== 1 ? "es" : ""})
                        </span>
                      </div>
                      <span className="font-semibold text-primary">
                        {formatarMoeda(premio.valorPremio)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Cidades Ganhadoras */}
            {locaisGanhadores && locaisGanhadores.length > 0 && (
              <section>
                <h3 className="text-base font-semibold mb-3">📍 Cidades Ganhadoras</h3>
                <div className="space-y-2">
                  {locaisGanhadores.map((local, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
                    >
                      <span className="text-base">
                        {local.cidade}, {local.estado}
                      </span>
                      <Badge variant="outline">
                        {local.ganhadores} ganhador{local.ganhadores !== 1 ? "es" : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Mensagem quando não há ganhadores */}
            {(!locaisGanhadores || locaisGanhadores.length === 0) && (
              <section>
                <h3 className="text-base font-semibold mb-3">📍 Cidades Ganhadoras</h3>
                <p className="text-muted-foreground text-base">
                  Nenhum ganhador neste concurso.
                </p>
              </section>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
