import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BarChart3, Search, Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLotomaniaResultados } from "@/hooks/useLotomaniaResultados";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SnapshotButton } from "@/components/shared/SnapshotButton";
import { cn } from "@/lib/utils";
import { ResultadoDetalhesSheetBase } from "@/components/ResultadoDetalhesSheetBase";

const ITEMS_PER_PAGE = 20;

export default function ResultadosLotomania() {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchConcurso, setSearchConcurso] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [selectedResultado, setSelectedResultado] = useState<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: allResultados, isLoading, error } = useLotomaniaResultados(200);

  const filteredResultados = (allResultados || []).filter((resultado) => {
    if (searchConcurso.trim()) {
      const concursoNum = parseInt(searchConcurso.trim());
      if (!isNaN(concursoNum) && resultado.concurso !== concursoNum) return false;
    }
    if (dateFilter) {
      const dateStr = format(dateFilter, "yyyy-MM-dd");
      if (resultado.data_sorteio !== dateStr) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredResultados.length / ITEMS_PER_PAGE);
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const resultados = filteredResultados.slice(from, from + ITEMS_PER_PAGE);

  const handleClearFilters = () => {
    setSearchConcurso("");
    setDateFilter(undefined);
    setCurrentPage(1);
  };

  const hasFilters = searchConcurso.trim() || dateFilter;

  return (
    <MainLayout pageTitle="Resultados Lotomania">
      <div className="container-senior py-6">
        {!isMobile && (
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-red-600" />
              <h1 className="text-xl font-bold">🎰 Resultados Lotomania</h1>
            </div>
            <SnapshotButton targetRef={contentRef} defaultTitle="Resultados Lotomania" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Buscar concurso..."
              value={searchConcurso}
              onChange={(e) => { setSearchConcurso(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
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
          {hasFilters && (
            <Button variant="ghost" onClick={handleClearFilters} className="gap-1">
              <X className="h-4 w-4" /> Limpar
            </Button>
          )}
        </div>

        <div ref={contentRef} className="space-y-2">
          {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="w-10 h-10 mb-2" /><p>Erro ao carregar resultados</p>
            </div>
          )}
          {!isLoading && !error && filteredResultados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="w-10 h-10 mb-2" />
              <p>{hasFilters ? "Nenhum resultado encontrado" : "Nenhum resultado disponível"}</p>
            </div>
          )}
          {!isLoading && !error && resultados.length > 0 && (
            <div className="space-y-1.5">
              {resultados.map((resultado) => (
                <ResultadoCompactoCard key={resultado.id} resultado={resultado} />
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

function ResultadoCompactoCard({ resultado }: { resultado: any }) {
  const dataFormatada = format(new Date(resultado.data_sorteio + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR });

  return (
    <div className="w-full py-3 px-3 hover:bg-accent/20 transition-colors rounded">
      <div className="text-left mb-2">
        <span className="text-xs text-muted-foreground">
          #{resultado.concurso} — {dataFormatada}
          {resultado.acumulou && <span className="ml-2 text-destructive font-semibold text-[10px]">ACUMULOU</span>}
        </span>
      </div>
      <div className="flex flex-wrap justify-start gap-1 mb-2">
        {resultado.dezenas.map((dezena: string, index: number) => (
          <div
            key={index}
            className={cn(
              "w-[26px] h-[26px] rounded-full flex items-center justify-center",
              "text-[11px] font-semibold",
              "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
            )}
          >
            {dezena}
          </div>
        ))}
      </div>
      <div className="text-left text-xs text-muted-foreground">
        {resultado.dezenas.length} dezenas sorteadas
      </div>
    </div>
  );
}
