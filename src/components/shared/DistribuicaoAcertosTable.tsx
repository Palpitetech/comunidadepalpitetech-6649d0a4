import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Trophy, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LoteriaType } from "./AcertosBadge";

interface DistribuicaoAcertosTableProps {
  /** Record de palpite ID -> acertos (para lotofacil/megasena) */
  acertosPorPalpite?: Record<string, number>;
  /** Record de palpite ID -> { s1, s2 } acertos (para dupla sena) */
  acertosDuplaSena?: Record<string, { s1: number; s2: number }>;
  /** Tipo de loteria */
  loteria: LoteriaType;
  /** Número do concurso verificado */
  concursoId?: number;
  /** Callback para fechar */
  onClose?: () => void;
  /** Classes adicionais */
  className?: string;
}

interface FaixaConfig {
  label: string;
  min: number;
  max: number;
  isPremio: boolean;
  className: string;
}

/**
 * Tabela de distribuição de acertos por faixa de pontos.
 * Suporta Lotofácil, Mega Sena e Dupla Sena.
 */
export function DistribuicaoAcertosTable({
  acertosPorPalpite = {},
  acertosDuplaSena = {},
  loteria,
  concursoId,
  onClose,
  className,
}: DistribuicaoAcertosTableProps) {
  const faixas = useMemo(() => getFaixas(loteria), [loteria]);
  
  const distribuicao = useMemo(() => {
    const counts: Record<string, number> = {};
    faixas.forEach(f => { counts[f.label] = 0; });
    
    if (loteria === "duplasena") {
      Object.values(acertosDuplaSena).forEach(({ s1, s2 }) => {
        const maior = Math.max(s1, s2);
        const faixa = faixas.find(f => maior >= f.min && maior <= f.max);
        if (faixa) counts[faixa.label]++;
      });
    } else {
      Object.values(acertosPorPalpite).forEach(acertos => {
        const faixa = faixas.find(f => acertos >= f.min && acertos <= f.max);
        if (faixa) counts[faixa.label]++;
      });
    }
    
    return counts;
  }, [acertosPorPalpite, acertosDuplaSena, faixas, loteria]);

  const totalPalpites = loteria === "duplasena" 
    ? Object.keys(acertosDuplaSena).length 
    : Object.keys(acertosPorPalpite).length;

  const themeColors = getThemeColors(loteria);

  if (totalPalpites === 0) return null;

  return (
    <div className={cn(
      "border rounded-xl p-3 animate-fade-in shadow-lg relative",
      themeColors.container,
      className
    )}>
      {onClose && (
        <button
          onClick={onClose}
          className={cn(
            "absolute top-2 right-2 transition-colors p-1",
            themeColors.closeButton
          )}
          aria-label="Fechar tabela"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      <div className="flex items-center gap-2 mb-3">
        <Trophy className={cn("h-5 w-5", themeColors.icon)} />
        <span className={cn("font-bold text-sm", themeColors.title)}>
          Distribuição de Acertos
          {concursoId && <span className="font-normal opacity-70 ml-1">#{concursoId}</span>}
        </span>
      </div>

      <div className="rounded-lg overflow-hidden border border-border/30">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn("text-xs font-semibold h-8", themeColors.headerText)}>
                Faixa
              </TableHead>
              <TableHead className={cn("text-xs font-semibold h-8 text-right", themeColors.headerText)}>
                Qtd
              </TableHead>
              <TableHead className={cn("text-xs font-semibold h-8 text-right", themeColors.headerText)}>
                %
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {faixas.map((faixa) => {
              const count = distribuicao[faixa.label] || 0;
              const percent = totalPalpites > 0 ? ((count / totalPalpites) * 100).toFixed(1) : "0.0";
              
              return (
                <TableRow 
                  key={faixa.label} 
                  className={cn(
                    "hover:bg-transparent transition-colors",
                    count > 0 && faixa.isPremio && themeColors.premioRowBg
                  )}
                >
                  <TableCell className="py-1.5 px-3">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      count > 0 ? faixa.className : "bg-muted/50 text-muted-foreground"
                    )}>
                      {faixa.label}
                    </span>
                  </TableCell>
                  <TableCell className={cn(
                    "py-1.5 px-3 text-right font-bold text-sm",
                    count > 0 && faixa.isPremio ? themeColors.premioText : "text-foreground"
                  )}>
                    {count}
                  </TableCell>
                  <TableCell className={cn(
                    "py-1.5 px-3 text-right text-xs",
                    count > 0 && faixa.isPremio ? themeColors.premioTextMuted : "text-muted-foreground"
                  )}>
                    {percent}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className={cn("mt-2 text-xs text-center", themeColors.footer)}>
        {totalPalpites} palpite{totalPalpites !== 1 ? "s" : ""} verificado{totalPalpites !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function getFaixas(loteria: LoteriaType): FaixaConfig[] {
  switch (loteria) {
    case "lotofacil":
      return [
        { label: "15 pontos", min: 15, max: 15, isPremio: true, className: "bg-purple-500 text-white" },
        { label: "14 pontos", min: 14, max: 14, isPremio: true, className: "bg-purple-600 text-white" },
        { label: "13 pontos", min: 13, max: 13, isPremio: true, className: "bg-purple-700 text-white" },
        { label: "12 pontos", min: 12, max: 12, isPremio: true, className: "bg-purple-800 text-purple-50" },
        { label: "11 pontos", min: 11, max: 11, isPremio: true, className: "bg-purple-900 text-purple-100" },
        { label: "10 pontos", min: 10, max: 10, isPremio: false, className: "bg-muted text-foreground" },
        { label: "9 pontos", min: 9, max: 9, isPremio: false, className: "bg-muted text-foreground" },
        { label: "8 ou menos", min: 0, max: 8, isPremio: false, className: "bg-muted/70 text-muted-foreground" },
      ];
    case "megasena":
      return [
        { label: "Sena (6)", min: 6, max: 6, isPremio: true, className: "bg-green-500 text-white" },
        { label: "Quina (5)", min: 5, max: 5, isPremio: true, className: "bg-green-600 text-white" },
        { label: "Quadra (4)", min: 4, max: 4, isPremio: true, className: "bg-green-700 text-white" },
        { label: "3 pontos", min: 3, max: 3, isPremio: false, className: "bg-muted text-foreground" },
        { label: "2 pontos", min: 2, max: 2, isPremio: false, className: "bg-muted text-foreground" },
        { label: "1 ou menos", min: 0, max: 1, isPremio: false, className: "bg-muted/70 text-muted-foreground" },
      ];
    case "duplasena":
      return [
        { label: "Sena (6)", min: 6, max: 6, isPremio: true, className: "bg-orange-500 text-white" },
        { label: "Quina (5)", min: 5, max: 5, isPremio: true, className: "bg-orange-600 text-white" },
        { label: "Quadra (4)", min: 4, max: 4, isPremio: true, className: "bg-orange-700 text-white" },
        { label: "Terno (3)", min: 3, max: 3, isPremio: true, className: "bg-orange-800 text-orange-50" },
        { label: "2 pontos", min: 2, max: 2, isPremio: false, className: "bg-muted text-foreground" },
        { label: "1 ou menos", min: 0, max: 1, isPremio: false, className: "bg-muted/70 text-muted-foreground" },
      ];
  }
}

function getThemeColors(loteria: LoteriaType) {
  switch (loteria) {
    case "lotofacil":
      return {
        container: "bg-purple-950 border-purple-600 shadow-purple-900/30",
        closeButton: "text-purple-400 hover:text-white",
        icon: "text-purple-300",
        title: "text-purple-200",
        headerText: "text-purple-300",
        premioRowBg: "bg-purple-900/30",
        premioText: "text-purple-200",
        premioTextMuted: "text-purple-300/70",
        footer: "text-purple-300/70",
      };
    case "megasena":
      return {
        container: "bg-green-950 border-green-600 shadow-green-900/30",
        closeButton: "text-green-400 hover:text-white",
        icon: "text-green-300",
        title: "text-green-200",
        headerText: "text-green-300",
        premioRowBg: "bg-green-900/30",
        premioText: "text-green-200",
        premioTextMuted: "text-green-300/70",
        footer: "text-green-300/70",
      };
    case "duplasena":
      return {
        container: "bg-orange-950 border-orange-600 shadow-orange-900/30",
        closeButton: "text-orange-400 hover:text-white",
        icon: "text-orange-300",
        title: "text-orange-200",
        headerText: "text-orange-300",
        premioRowBg: "bg-orange-900/30",
        premioText: "text-orange-200",
        premioTextMuted: "text-orange-300/70",
        footer: "text-orange-300/70",
      };
  }
}
