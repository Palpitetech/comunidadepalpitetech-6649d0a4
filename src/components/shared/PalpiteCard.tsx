import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as lotofacilLib from "@/lib/lotofacil";
import * as quinaLib from "@/lib/quina";
import { cn } from "@/lib/utils";
import { Trash2, Copy, Trophy, ChevronDown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AcertosBadge } from "./AcertosBadge";

interface ConcursoOption {
  concurso_id: number;
  data_sorteio: string;
  dezenas: number[];
}

export interface PalpiteCardProps {
  index: number;
  dezenas: number[];
  ultimoConcursoDezenas?: number[];
  dezenasFixes?: number[];
  isSelected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  onDelete?: () => void;
  onCopy?: () => void;
  hideSelection?: boolean;
  hideStats?: boolean;
  label?: string;
  createdAt?: string;
  acertos?: number | null;
  onVerificar?: (concursoId: number, acertos: number) => void;
  hideVerificar?: boolean;
  loteria?: string;
}

function getLib(loteria: string) {
  switch (loteria) {
    case "quina":
      return {
        formatarDezena: quinaLib.formatarDezena,
        contarImpares: quinaLib.contarImpares,
        contarMoldura: quinaLib.contarMoldura,
        contarMultiplosDe3: quinaLib.contarMultiplosDe3,
        contarRepetidas: quinaLib.contarRepetidas,
      };
    default:
      return {
        formatarDezena: lotofacilLib.formatarDezena,
        contarImpares: lotofacilLib.contarImpares,
        contarMoldura: lotofacilLib.contarMoldura,
        contarMultiplosDe3: lotofacilLib.contarMultiplosDe3,
        contarRepetidas: lotofacilLib.contarRepetidas,
      };
  }
}

export function PalpiteCard({
  index,
  dezenas,
  ultimoConcursoDezenas = [],
  dezenasFixes = [],
  isSelected = false,
  onSelectChange,
  onDelete,
  onCopy,
  hideSelection = false,
  hideStats = false,
  label,
  createdAt,
  acertos,
  onVerificar,
  hideVerificar = false,
  loteria = "lotofacil",
}: PalpiteCardProps) {
  const lib = getLib(loteria);
  const [concursos, setConcursos] = useState<ConcursoOption[]>([]);
  const [loadingConcursos, setLoadingConcursos] = useState(false);
  const [concursosLoaded, setConcursosLoaded] = useState(false);
  const [localAcertos, setLocalAcertos] = useState<number | null>(acertos ?? null);
  const [concursoVerificado, setConcursoVerificado] = useState<number | null>(null);

  const impares = lib.contarImpares(dezenas);
  const moldura = lib.contarMoldura(dezenas);
  const multiplosDe3 = lib.contarMultiplosDe3(dezenas);
  const repetidas = ultimoConcursoDezenas.length > 0 
    ? lib.contarRepetidas(dezenas, ultimoConcursoDezenas) 
    : 0;

  const handleLoadConcursos = async () => {
    if (concursosLoaded) return;
    
    setLoadingConcursos(true);
    try {
      const { data } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso_id:concurso, data_sorteio, dezenas")
        .eq("loteria", loteria)
        .order("concurso", { ascending: false })
        .limit(30);
      
      if (data) {
        setConcursos(data);
        setConcursosLoaded(true);
      }
    } catch (error) {
      console.error("Erro ao carregar concursos:", error);
    } finally {
      setLoadingConcursos(false);
    }
  };

  const handleVerificar = (concurso: ConcursoOption) => {
    const acertosCount = dezenas.filter(d => concurso.dezenas.includes(d)).length;
    setLocalAcertos(acertosCount);
    setConcursoVerificado(concurso.concurso_id);
    onVerificar?.(concurso.concurso_id, acertosCount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const metade = Math.ceil(dezenas.length / 2);
  const primeiraLinha = dezenas.slice(0, metade);
  const segundaLinha = dezenas.slice(metade);

  const handleCardClick = () => {
    if (!hideSelection && onSelectChange) {
      onSelectChange(!isSelected);
    }
  };

  const displayLabel = label || `Jogo ${String(index + 1).padStart(2, '0')}`;

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "rounded-xl border p-3 transition-all",
        !hideSelection && "cursor-pointer active:scale-[0.98]",
        isSelected
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border bg-card"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {!hideSelection && onSelectChange && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelectChange}
              className="h-5 w-5 shrink-0"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm">
              {displayLabel}
            </span>
            {createdAt && (
              <span className="text-[10px] text-muted-foreground">
                {new Date(createdAt).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {(localAcertos !== null || (acertos !== undefined && acertos !== null)) && (
            <AcertosBadge 
              acertos={localAcertos ?? acertos ?? 0} 
              loteria={loteria}
              showConcurso={concursoVerificado}
            />
          )}
          
          {isSelected && !hideSelection && (
            <span className="text-[10px] font-medium text-primary bg-primary/20 px-2 py-0.5 rounded-full">
              Selecionado
            </span>
          )}

          {!hideVerificar && (
            <DropdownMenu onOpenChange={(open) => open && handleLoadConcursos()}>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="bg-popover z-50 w-56 max-h-64 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
                  Verificar prêmio
                </div>
                {loadingConcursos ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    Carregando...
                  </div>
                ) : concursos.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    Nenhum concurso disponível
                  </div>
                ) : (
                  concursos.map((concurso) => (
                    <DropdownMenuItem
                      key={concurso.concurso_id}
                      onClick={() => handleVerificar(concurso)}
                      className="gap-2 cursor-pointer"
                    >
                      <div className="flex-1">
                        <span className="font-medium">#{concurso.concurso_id}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          {formatDate(concurso.data_sorteio)}
                        </span>
                      </div>
                      {concursoVerificado === concurso.concurso_id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {onCopy && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onCopy();
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Dezenas */}
      <div className="space-y-1 mb-2">
        <div className="flex flex-wrap gap-1">
          {primeiraLinha.map((dezena) => {
            const isFixa = dezenasFixes.includes(dezena);
            return (
              <span
                key={dezena}
                className={cn(
                  "w-7 h-7 flex items-center justify-center rounded-md font-bold text-xs",
                  isFixa 
                    ? "bg-palpite-fixa text-palpite-fixa-foreground" 
                    : "bg-palpite-dezena text-palpite-dezena-foreground"
                )}
              >
                {lib.formatarDezena(dezena)}
              </span>
            );
          })}
        </div>
        {segundaLinha.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {segundaLinha.map((dezena) => {
              const isFixa = dezenasFixes.includes(dezena);
              return (
                <span
                  key={dezena}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-md font-bold text-xs",
                    isFixa 
                      ? "bg-palpite-fixa text-palpite-fixa-foreground" 
                      : "bg-palpite-dezena text-palpite-dezena-foreground"
                  )}
                >
                  {lib.formatarDezena(dezena)}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {!hideStats && (
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground border-t border-border/50 pt-2 mt-1">
          <span>Ímp <strong className="text-foreground">{impares}</strong></span>
          <span>Mold <strong className="text-foreground">{moldura}</strong></span>
          {ultimoConcursoDezenas.length > 0 && (
            <span>Rep <strong className="text-foreground">{repetidas}</strong></span>
          )}
          <span>M3 <strong className="text-foreground">{multiplosDe3}</strong></span>
        </div>
      )}
    </div>
  );
}
