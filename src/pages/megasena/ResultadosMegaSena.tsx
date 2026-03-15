import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BarChart3, Search, Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useResultados } from "@/hooks/useResultados";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SnapshotButton } from "@/components/shared/SnapshotButton";
import { DezenaCirculoMini } from "@/components/megasena/DezenaCirculoMini";
import { ResultadoSheet } from "@/components/resultados/ResultadoSheet";

const ITEMS_PER_PAGE = 20;

export default function ResultadosMegaSena() {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchConcurso, setSearchConcurso] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedResultado, setSelectedResultado] = useState<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: allResultados, isLoading, error } = useResultados("megasena", 200);

  const filteredResultados = (allResultados || []).filter((r) => {
    if (searchConcurso.trim()) {
      const num = parseInt(searchConcurso.trim());
      if (!isNaN(num) && r.concurso !== num) return false;
    }
    if (dateFilter && r.data_sorteio !== format(dateFilter, "yyyy-MM-dd")) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredResultados.length / ITEMS_PER_PAGE);
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const resultados = filteredResultados.slice(from, from + ITEMS_PER_PAGE);

  const handleClearFilters = () => { setSearchConcurso(""); setDateFilter(undefined); setCurrentPage(1); };
  const hasFilters = searchConcurso.trim() || dateFilter;

  return (
    <MainLayout pageTitle="Resultados">
      <div className="container-senior py-6">
        {!isMobile && (
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold">Resultados Mega Sena</h1>
            </div>
            <SnapshotButton targetRef={contentRef} defaultTitle="Resultados Mega Sena" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="number" placeholder="Buscar concurso..." value={searchConcurso} onChange={(e) => { setSearchConcurso(e.target.value); setCurrentPage(1); }} className="pl-10" />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 justify-start sm:w-auto w-full">
                <CalendarIcon className="h-4 w-4" />
                {dateFilter ? format(dateFilter, "dd/MM/yyyy", { locale: ptBR }) : "Filtrar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFilter} onSelect={(date) => { setDateFilter(date); setCurrentPage(1); }} locale={ptBR} initialFocus />
            </PopoverContent>
          </Popover>
          {hasFilters && <Button variant="ghost" onClick={handleClearFilters} className="gap-1"><X className="h-4 w-4" /> Limpar</Button>}
        </div>

        <div ref={contentRef} className="space-y-2">
          {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          {error && <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><AlertCircle className="w-10 h-10 mb-2" /><p>Erro ao carregar resultados</p></div>}
          {!isLoading && !error && filteredResultados.length === 0 && <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><AlertCircle className="w-10 h-10 mb-2" /><p>{hasFilters ? "Nenhum resultado encontrado com esses filtros" : "Nenhum resultado disponível"}</p></div>}
          {!isLoading && !error && resultados.length > 0 && (
            <div className="space-y-1.5">
              {resultados.map((resultado) => (
                <ResultadoCompactoCard key={resultado.id} resultado={resultado} onClick={() => setSelectedResultado(resultado)} />
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
        <ResultadoSheet open={!!selectedResultado} onClose={() => setSelectedResultado(null)} resultado={selectedResultado} loteria="megasena" />
      </div>
    </MainLayout>
  );
}

function ResultadoCompactoCard({ resultado, onClick }: { resultado: any; onClick: () => void }) {
  const dataFormatada = format(new Date(resultado.data_sorteio + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });
  return (
    <button onClick={onClick} className="w-full py-3 px-3 text-left hover:bg-accent/20 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 cursor-pointer rounded">
      <div className="text-left mb-2">
        <span className="text-xs text-muted-foreground">
          #{resultado.concurso} — {dataFormatada}
          {resultado.acumulou && <span className="ml-2 text-destructive font-semibold text-[10px]">ACUMULOU</span>}
        </span>
      </div>
      <div className="flex justify-start gap-1.5 mb-2">
        {resultado.dezenas.map((dezena: number, index: number) => (
          <DezenaCirculoMini key={index} dezena={dezena} />
        ))}
      </div>
      <div className="text-left text-xs text-muted-foreground">
        Pares: {resultado.qtd_pares ?? "-"} | Moldura: {resultado.qtd_moldura ?? "-"} | Primos: {resultado.qtd_primos ?? "-"}
        {resultado.qtd_repetidas && resultado.qtd_repetidas > 0 && (
          <span> | Repetidas: <span className="text-destructive font-semibold">{resultado.qtd_repetidas}</span></span>
        )}
      </div>
    </button>
  );
}
