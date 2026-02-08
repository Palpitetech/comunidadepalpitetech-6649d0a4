import { useState } from "react";
import { X, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectedFilters {
  impares: number[];
  repetidas: number[];
  moldura: number[];
  primos: number[];
  m3: number[];
}

interface FloatingNotesProps {
  selectedFilters: SelectedFilters;
}

const FILTER_LABELS: Record<keyof SelectedFilters, string> = {
  impares: "Ímpares",
  repetidas: "Repetidas",
  moldura: "Moldura",
  primos: "Primos",
  m3: "Múlt. 3",
};

export function FloatingNotes({ selectedFilters }: FloatingNotesProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Conta total de valores selecionados
  const totalSelected = Object.values(selectedFilters).reduce(
    (acc, arr) => acc + arr.length, 0
  );

  // Não mostra se não tiver filtros selecionados
  if (totalSelected === 0) return null;

  // FAB fechado
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
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
      <div className="flex items-center justify-between p-3 border-b bg-orange-500 rounded-t-lg">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-white" />
          <span className="text-sm font-semibold text-white">Filtros Selecionados</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-white hover:bg-orange-600 hover:text-white"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
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
    </div>
  );
}
