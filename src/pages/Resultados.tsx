import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BarChart3, Search, Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useResultadosPaginados } from "@/hooks/useResultados";
import { ResultadoCard } from "@/components/lotofacil/ResultadoCard";
import { ResultadoSheet } from "@/components/resultados/ResultadoSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SnapshotButton } from "@/components/shared/SnapshotButton";

const ITEMS_PER_PAGE = 20;

export default function Resultados() {
  const isMobile = useIsMobile();
  const [selectedResultado, setSelectedResultado] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchConcurso, setSearchConcurso] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useResultadosPaginados(
    "lotofacil",
    currentPage,
    ITEMS_PER_PAGE,
    {
      searchConcurso,
      dateFilter: dateFilter ? format(dateFilter, "yyyy-MM-dd") : undefined,
    }
  );

  const totalPages = Math.ceil((data?.totalCount ?? 0) / ITEMS_PER_PAGE);
  const resultados = data?.resultados ?? [];

  const handleClearFilters = () => {
    setSearchConcurso("");
    setDateFilter(undefined);
    setCurrentPage(1);
  };

  const hasFilters = searchConcurso.trim() || dateFilter;

  // Adapter: Ensure concurso_id exists for both table structures
  const adaptResultado = (r: any) => ({ 
    ...r, 
    concurso_id: r.concurso_id ?? r.concurso,
    concurso: r.concurso ?? r.concurso_id 
  });

  return (
    <MainLayout pageTitle="Resultados">
      <div className="container-senior py-6">
        {!isMobile && (
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-7 w-7 text-primary" />
              <h1 className="text-xl font-bold">Resultados</h1>
            </div>
            <SnapshotButton targetRef={contentRef} defaultTitle="Resultados Lotofácil" />
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

        {data && !isLoading && (
          <div className="text-sm text-muted-foreground mb-3">
            {hasFilters ? (
              <span>{data.totalCount === 0 ? "Nenhum resultado encontrado" : `${data.totalCount} resultado${data.totalCount > 1 ? "s" : ""} encontrado${data.totalCount > 1 ? "s" : ""}`}</span>
            ) : (
              <span>Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, data.totalCount)} de {data.totalCount} resultados</span>
            )}
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-4 px-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 15 }).map((_, j) => <Skeleton key={j} className="w-7 h-7 rounded-full" />)}
                  </div>
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-left">
            <p className="text-base">Erro ao carregar os resultados. Tente novamente.</p>
          </div>
        )}

        {resultados.length > 0 && (
          <div ref={contentRef} className="divide-y divide-border/50">
            {resultados.map((resultado) => (
              <ResultadoCard
                key={resultado.id}
                resultado={adaptResultado(resultado)}
                onClick={() => setSelectedResultado(resultado)}
              />
            ))}
          </div>
        )}

        {!isLoading && resultados.length === 0 && !error && (
          <div className="bg-muted/50 rounded-lg p-8 text-left">
            <p className="text-base text-muted-foreground">
              {hasFilters ? "Nenhum resultado encontrado para os filtros aplicados." : "Nenhum resultado disponível ainda."}
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6 py-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="gap-2">
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
            <Button variant="outline" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="gap-2">
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <ResultadoSheet
          resultado={selectedResultado}
          open={!!selectedResultado}
          onClose={() => setSelectedResultado(null)}
          loteria="lotofacil"
        />
      </div>
    </MainLayout>
  );
}
