import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { BarChart3, Search, Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { ResultadoCard } from "@/components/lotofacil/ResultadoCard";
import { ResultadoDetalhesSheet } from "@/components/lotofacil/ResultadoDetalhesSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SnapshotButton } from "@/components/shared/SnapshotButton";

interface Resultado {
  id: string;
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
  premiacao_json: unknown;
  locais_ganhadores: unknown;
}

const ITEMS_PER_PAGE = 20;

export default function Resultados() {
  const isMobile = useIsMobile();
  const [selectedResultado, setSelectedResultado] = useState<Resultado | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchConcurso, setSearchConcurso] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["resultados", currentPage, searchConcurso, dateFilter?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("resultados")
        .select("*", { count: "exact" })
        .order("concurso_id", { ascending: false });

      // Filtro por número do concurso
      if (searchConcurso.trim()) {
        const concursoNum = parseInt(searchConcurso.trim());
        if (!isNaN(concursoNum)) {
          query = query.eq("concurso_id", concursoNum);
        }
      }

      // Filtro por data
      if (dateFilter) {
        const dateStr = format(dateFilter, "yyyy-MM-dd");
        query = query.eq("data_sorteio", dateStr);
      }

      // Paginação
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      if (error) throw error;

      return { resultados: data as Resultado[], totalCount: count ?? 0 };
    },
  });

  const totalPages = Math.ceil((data?.totalCount ?? 0) / ITEMS_PER_PAGE);
  const resultados = data?.resultados ?? [];

  const handleClearFilters = () => {
    setSearchConcurso("");
    setDateFilter(undefined);
    setCurrentPage(1);
  };

  const hasFilters = searchConcurso.trim() || dateFilter;

  return (
    <MainLayout>
      <div className="container-senior py-6">
        {/* Header compacto */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold">Resultados</h1>
          </div>
          <SnapshotButton 
            targetRef={contentRef} 
            defaultTitle="Resultados Lotofácil"
          />
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Busca por Concurso */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Buscar concurso..."
              value={searchConcurso}
              onChange={(e) => {
                setSearchConcurso(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Filtro por Data */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 justify-start sm:w-auto w-full">
                <CalendarIcon className="h-4 w-4" />
                {dateFilter ? format(dateFilter, "dd/MM/yyyy", { locale: ptBR }) : "Filtrar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={(date) => {
                  setDateFilter(date);
                  setCurrentPage(1);
                }}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Limpar Filtros */}
          {hasFilters && (
            <Button variant="ghost" onClick={handleClearFilters} className="gap-1">
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        {/* Contador de resultados */}
        {data && !isLoading && (
          <div className="text-sm text-muted-foreground mb-3">
            {hasFilters ? (
              <span>
                {data.totalCount === 0
                  ? "Nenhum resultado encontrado"
                  : `${data.totalCount} resultado${data.totalCount > 1 ? "s" : ""} encontrado${data.totalCount > 1 ? "s" : ""}`}
              </span>
            ) : (
              <span>
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, data.totalCount)} de {data.totalCount} resultados
              </span>
            )}
          </div>
        )}

        {/* Estado de Loading */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="py-4 px-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 15 }).map((_, j) => (
                      <Skeleton key={j} className="w-7 h-7 rounded-full" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estado de Erro */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-left">
            <p className="text-base">Erro ao carregar os resultados. Tente novamente.</p>
          </div>
        )}

        {/* Lista de Resultados */}
        {resultados.length > 0 && (
          <div ref={contentRef} className="divide-y divide-border/50">
            {resultados.map((resultado) => (
              <ResultadoCard
                key={resultado.id}
                resultado={resultado}
                onClick={() => setSelectedResultado(resultado)}
              />
            ))}
          </div>
        )}

        {/* Estado Vazio */}
        {!isLoading && resultados.length === 0 && !error && (
          <div className="bg-muted/50 rounded-lg p-8 text-left">
            <p className="text-base text-muted-foreground">
              {hasFilters
                ? "Nenhum resultado encontrado para os filtros aplicados."
                : "Nenhum resultado disponível ainda."}
            </p>
          </div>
        )}

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6 py-4 border-t border-border/50">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>

            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="gap-2"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Sheet de Detalhes */}
        <ResultadoDetalhesSheet
          resultado={selectedResultado as any}
          open={!!selectedResultado}
          onOpenChange={(open) => !open && setSelectedResultado(null)}
        />
      </div>
    </MainLayout>
  );
}
