import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Loteria = "lotofacil" | "megasena" | "duplasena" | "quina" | "lotomania" | "diadesorte";

interface PremiacaoNormalizada {
  faixa: string;
  descricao: string;
  ganhadores: number;
  valorPremio: number;
}

interface LocalGanhador {
  cidade: string;
  uf: string;
  ganhadores: number;
}

interface ResultadoSheetProps {
  open: boolean;
  onClose: () => void;
  resultado: any | null;
  loteria: Loteria;
}

const DEZENA_COLORS: Record<Loteria, string> = {
  lotofacil: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  megasena: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  duplasena: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  quina: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  lotomania: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  diadesorte: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

function formatarMoeda(valor: number): string {
  if (valor >= 1_000_000) {
    return `R$ ${(valor / 1_000_000).toFixed(1).replace(".", ",")} Mi`;
  }
  if (valor >= 1000) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(valor);
  }
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
}

function getNumeroConcurso(r: any): string | number {
  return r.concurso ?? r.concurso_id ?? r.numero_concurso ?? "—";
}

function formatData(dataSorteio: string): string {
  try {
    return format(parseISO(dataSorteio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dataSorteio;
  }
}

function normalizarDezenas(raw: any[]): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((d: any) => String(d).padStart(2, "0"));
}

function normalizarPremiacao(json: any): PremiacaoNormalizada[] {
  if (!Array.isArray(json)) return [];
  return json.map((p: any) => ({
    faixa: String(p.faixa ?? ""),
    descricao: String(p.faixa ?? p.descricao ?? ""),
    ganhadores: Number(p.ganhadores ?? p.numero_ganhadores ?? 0),
    valorPremio: Number(p.valor ?? p.valorPremio ?? p.valor_premio ?? 0),
  }));
}

function normalizarLocais(json: any): LocalGanhador[] {
  if (!Array.isArray(json)) return [];
  return json.map((l: any) => ({
    cidade: String(l.cidade ?? l.municipio ?? ""),
    uf: String(l.uf ?? l.estado ?? ""),
    ganhadores: Number(l.ganhadores ?? 0),
  }));
}

// ── Dezenas Grid ──────────────────────────────────────

function DezenasBall({ value, colorClass, size = "w-10 h-10 text-sm" }: { value: string; colorClass: string; size?: string }) {
  return (
    <div className={cn("aspect-square rounded-full flex items-center justify-center font-bold", size, colorClass)}>
      {value}
    </div>
  );
}

function DezenasGrid({ dezenas, loteria }: { dezenas: string[]; loteria: Loteria }) {
  const color = DEZENA_COLORS[loteria];
  if (loteria === "lotofacil") {
    return (
      <div className="grid grid-cols-5 gap-2">
        {dezenas.map((d, i) => <DezenasBall key={i} value={d} colorClass={color} size="w-full h-auto aspect-square text-sm" />)}
      </div>
    );
  }
  if (loteria === "lotomania") {
    return (
      <div className="grid grid-cols-5 gap-1.5">
        {dezenas.map((d, i) => <DezenasBall key={i} value={d} colorClass={color} size="w-10 h-10 text-xs" />)}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {dezenas.map((d, i) => <DezenasBall key={i} value={d} colorClass={color} size="w-12 h-12 text-base" />)}
    </div>
  );
}

function IndicatorPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-sm font-medium">
      {label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────

export function ResultadoSheet({ open, onClose, resultado, loteria }: ResultadoSheetProps) {
  if (!resultado) return null;

  const numeroConcurso = getNumeroConcurso(resultado);
  const dataFormatada = formatData(resultado.data_sorteio);
  const premiacao = normalizarPremiacao(resultado.premiacao_json);
  const locaisGanhadores = normalizarLocais(resultado.locais_ganhadores);

  const isDuplaSena = loteria === "duplasena";

  // Unified table: dezenas = main draw, dezenas_sorteio2 = 2nd draw
  // Legacy tables: dezenas_sorteio1 = main, dezenas_sorteio2 = 2nd
  const dezenasGroups: { label?: string; dezenas: string[] }[] = isDuplaSena
    ? [
        { label: "1º Sorteio", dezenas: normalizarDezenas(resultado.dezenas ?? resultado.dezenas_sorteio1) },
        { label: "2º Sorteio", dezenas: normalizarDezenas(resultado.dezenas_sorteio2) },
      ]
    : [{ dezenas: normalizarDezenas(resultado.dezenas) }];

  // Indicators — unified table uses qtd_pares directly; legacy dupla uses _s1
  const pares = resultado.qtd_pares ?? resultado.qtd_pares_s1 ?? null;
  const impares = resultado.qtd_impares ?? resultado.qtd_impares_s1 ?? null;
  const moldura = resultado.qtd_moldura ?? resultado.qtd_moldura_s1 ?? null;
  const primos = resultado.qtd_primos ?? resultado.qtd_primos_s1 ?? null;
  const repetidas = resultado.qtd_repetidas ?? resultado.qtd_repetidas_s1 ?? null;
  const totalDezenas = dezenasGroups[0].dezenas.length;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[95vh] rounded-t-2xl p-0">
        <ScrollArea className="h-full">
          <div className="px-5 pb-8">
            <SheetHeader className="text-left pt-5 pb-3">
              <div className="flex items-start justify-between">
                <SheetTitle className="text-xl font-bold tracking-tight">
                  Concurso #{numeroConcurso}
                </SheetTitle>
              </div>
              <p className="text-sm text-muted-foreground">{dataFormatada}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {resultado.acumulou && (
                  <span className="inline-flex items-center bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs font-semibold rounded-full px-2 py-0.5">
                    🔥 Acumulado
                  </span>
                )}
                {loteria === "diadesorte" && resultado.mes_sorte && (
                  <span className="inline-flex items-center bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 text-xs font-semibold rounded-full px-2 py-0.5">
                    📅 {resultado.mes_sorte}
                  </span>
                )}
              </div>
            </SheetHeader>

            <div className="h-px bg-border/50 mb-5" />

            {dezenasGroups.map((group, idx) => (
              <section key={idx} className="mb-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  {group.label || "Dezenas Sorteadas"}
                </p>
                <DezenasGrid dezenas={group.dezenas} loteria={loteria} />
              </section>
            ))}

            <div className="h-px bg-border/50 mb-5" />

            <section className="mb-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Indicadores</p>
              <div className="flex flex-wrap gap-2">
                {pares !== null ? (
                  <>
                    <IndicatorPill label={`🔵 Pares: ${pares}`} />
                    {impares !== null && <IndicatorPill label={`🟣 Ímpares: ${impares}`} />}
                    {moldura !== null && <IndicatorPill label={`🟡 Moldura: ${moldura}`} />}
                    {primos !== null && <IndicatorPill label={`🟢 Primos: ${primos}`} />}
                    {repetidas !== null && repetidas > 0 && <IndicatorPill label={`🔴 Repetidas: ${repetidas}`} />}
                  </>
                ) : (
                  <IndicatorPill label={`📊 ${totalDezenas} dezenas sorteadas`} />
                )}
              </div>
            </section>

            <div className="h-px bg-border/50 mb-5" />

            <section className="mb-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Premiação</p>
              {premiacao.length > 0 ? (
                <div>
                  {premiacao.map((premio, idx) => {
                    const isTop = idx < 2;
                    return (
                      <div key={idx} className="flex justify-between items-center py-2.5 border-b border-border/30 last:border-0">
                        <div>
                          <span className="text-sm font-medium">{premio.descricao}</span>
                          <span className="text-muted-foreground text-xs ml-2">
                            ({premio.ganhadores} ganhador{premio.ganhadores !== 1 ? "es" : ""})
                          </span>
                          {isTop && <span className="ml-1.5 text-xs">🥇</span>}
                        </div>
                        <span className={cn("font-semibold text-sm tabular-nums", isTop ? "text-yellow-600 dark:text-yellow-400" : "text-foreground")}>
                          {formatarMoeda(premio.valorPremio)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Premiação não disponível</p>
              )}
            </section>

            {locaisGanhadores.length > 0 && (
              <section className="mb-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Ganhadores</p>
                <div>
                  {locaisGanhadores.map((local, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                      <span className="text-sm">{local.cidade}{local.uf ? `, ${local.uf}` : ""}</span>
                      <span className="text-xs text-muted-foreground">
                        {local.ganhadores} ganhador{local.ganhadores !== 1 ? "es" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
