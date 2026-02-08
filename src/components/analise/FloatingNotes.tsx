import { useState } from "react";
import { X, NotebookPen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatarDezena } from "@/lib/lotofacil";

interface SelectedFilters {
  impares: number[];
  repetidas: number[];
  moldura: number[];
  primos: number[];
  m3: number[];
}

interface FloatingNotesProps {
  selectedFilters: SelectedFilters;
  selectedFixas: number[];
  selectedExcluidas: number[];
  selectedGrupoDezenas?: number[];
  selectedGrupoLabel?: string;
  onNavigate?: () => void;
}

const FILTER_LABELS: Record<keyof SelectedFilters, string> = {
  impares: "Ímpares",
  repetidas: "Repetidas",
  moldura: "Moldura",
  primos: "Primos",
  m3: "Múlt. 3",
};

export function FloatingNotes({ 
  selectedFilters, 
  selectedFixas, 
  selectedExcluidas, 
  selectedGrupoDezenas = [],
  selectedGrupoLabel,
  onNavigate 
}: FloatingNotesProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Conta total de valores selecionados
  const totalFilters = Object.values(selectedFilters).reduce(
    (acc, arr) => acc + arr.length, 0
  );
  const totalSelected = totalFilters + selectedFixas.length + selectedExcluidas.length + selectedGrupoDezenas.length;

  // Não mostra se não tiver nada selecionado
  if (totalSelected === 0) return null;

  // FAB fechado
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        <NotebookPen className="h-6 w-6" />
        {/* Badge com contador */}
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
          {totalSelected}
        </span>
      </button>
    );
  }

  // Painel aberto
  return (
    <div className="fixed bottom-20 right-4 z-50 w-72 rounded-lg border bg-card shadow-xl animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between p-3 border-b bg-amber-500 rounded-t-lg">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-white" />
          <span className="text-sm font-semibold text-white">Seleções</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-white hover:bg-amber-600 hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
        {/* Filtros de padrões */}
        {totalFilters > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Filtros</span>
            {(Object.keys(selectedFilters) as (keyof SelectedFilters)[]).map((key) => {
              const values = selectedFilters[key];
              if (values.length === 0) return null;
              
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-16">
                    {FILTER_LABELS[key]}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {values.map((v) => (
                      <span
                        key={v}
                        className="px-2 py-0.5 rounded text-xs font-semibold bg-highlight text-highlight-foreground"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dezenas Fixas */}
        {selectedFixas.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Dezenas Fixas</span>
            <div className="flex flex-wrap gap-1">
              {selectedFixas.map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 rounded text-xs font-semibold bg-foreground text-background"
                >
                  {formatarDezena(d)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dezenas Excluídas */}
        {selectedExcluidas.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Dezenas Excluídas</span>
            <div className="flex flex-wrap gap-1">
              {selectedExcluidas.map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 rounded text-xs font-semibold bg-foreground text-background"
                >
                  {formatarDezena(d)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Grupo Perfeito */}
        {selectedGrupoDezenas.length > 0 && selectedGrupoLabel && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">
              Grupo {selectedGrupoLabel}
            </span>
            <div className="flex flex-wrap gap-1">
              {selectedGrupoDezenas.map((d) => (
                <span
                  key={d}
                  className="px-2 py-0.5 rounded text-xs font-semibold bg-primary text-primary-foreground"
                >
                  {formatarDezena(d)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botão de usar no desdobramento */}
      {onNavigate && (
        <div className="p-3 border-t">
          <Button 
            onClick={onNavigate}
            className="w-full gap-2 bg-highlight hover:bg-highlight/90 text-highlight-foreground font-semibold h-9"
          >
            <Sparkles className="h-4 w-4" />
            Usar no Desdobramento
          </Button>
        </div>
      )}
    </div>
  );
}
