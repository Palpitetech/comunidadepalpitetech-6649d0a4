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
  const isDuplaSena = loteria === "duplasena";
  
  // Distribuição para Lotofácil/Mega Sena (single column)
  const distribuicao = useMemo(() => {
    if (isDuplaSena) return {};
    
    const counts: Record<string, number> = {};
    faixas.forEach(f => { counts[f.label] = 0; });
    
    Object.values(acertosPorPalpite).forEach(acertos => {
      const faixa = faixas.find(f => acertos >= f.min && acertos <= f.max);
      if (faixa) counts[faixa.label]++;
    });
    
    return counts;
  }, [acertosPorPalpite, faixas, isDuplaSena]);

  // Distribuição para Dupla Sena (S1 e S2 separados)
  const distribuicaoDuplaSena = useMemo(() => {
    if (!isDuplaSena) return { s1: {}, s2: {} };
    
    const countsS1: Record<string, number> = {};
    const countsS2: Record<string, number> = {};
    faixas.forEach(f => { 
      countsS1[f.label] = 0; 
      countsS2[f.label] = 0;
    });
    
    Object.values(acertosDuplaSena).forEach(({ s1, s2 }) => {
      const faixaS1 = faixas.find(f => s1 >= f.min && s1 <= f.max);
      const faixaS2 = faixas.find(f => s2 >= f.min && s2 <= f.max);
      if (faixaS1) countsS1[faixaS1.label]++;
      if (faixaS2) countsS2[faixaS2.label]++;
    });
    
    return { s1: countsS1, s2: countsS2 };
  }, [acertosDuplaSena, faixas, isDuplaSena]);

  const totalPalpites = isDuplaSena 
    ? Object.keys(acertosDuplaSena).length 
    : Object.keys(acertosPorPalpite).length;

  const themeColors = getThemeColors(loteria);

  if (totalPalpites === 0) return null;

  // Render para Dupla Sena (duas colunas S1 e S2)
  if (isDuplaSena) {
    return (
      <div className={cn(
        "bg-card border border-border rounded-xl p-3 animate-fade-in shadow-sm relative",
        className
      )}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Fechar tabela"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        <div className="flex items-center gap-2 mb-3">
          <Trophy className={cn("h-5 w-5", themeColors.icon)} />
          <span className="font-bold text-sm text-foreground">
            Distribuição de Acertos
            {concursoId && <span className="font-normal text-muted-foreground ml-1">#{concursoId}</span>}
          </span>
        </div>

        <div className="rounded-lg overflow-hidden border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/50">
                <TableHead className="text-xs font-semibold h-8 text-foreground">
                  Faixa
                </TableHead>
                <TableHead className="text-xs font-semibold h-8 text-center text-foreground">
                  S1
                </TableHead>
                <TableHead className="text-xs font-semibold h-8 text-center text-foreground">
                  S2
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faixas.map((faixa) => {
                const countS1 = distribuicaoDuplaSena.s1[faixa.label] || 0;
                const countS2 = distribuicaoDuplaSena.s2[faixa.label] || 0;
                const hasAny = countS1 > 0 || countS2 > 0;
                
                return (
                  <TableRow 
                    key={faixa.label} 
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      hasAny && faixa.isPremio && "bg-muted/20"
                    )}
                  >
                    <TableCell className="py-1.5 px-3">
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        hasAny ? faixa.className : "bg-muted text-muted-foreground"
                      )}>
                        {faixa.label}
                      </span>
                    </TableCell>
                    <TableCell className={cn(
                      "py-1.5 px-3 text-center font-bold text-sm",
                      countS1 > 0 && faixa.isPremio ? themeColors.premioText : "text-foreground"
                    )}>
                      {countS1}
                    </TableCell>
                    <TableCell className={cn(
                      "py-1.5 px-3 text-center font-bold text-sm",
                      countS2 > 0 && faixa.isPremio ? themeColors.premioText : "text-foreground"
                    )}>
                      {countS2}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-2 text-xs text-center text-muted-foreground">
          {totalPalpites} palpite{totalPalpites !== 1 ? "s" : ""} verificado{totalPalpites !== 1 ? "s" : ""} nos 2 sorteios
        </div>
      </div>
    );
  }

  // Render padrão para Lotofácil/Mega Sena
  return (
    <div className={cn(
      "bg-card border border-border rounded-xl p-3 animate-fade-in shadow-sm relative",
      className
    )}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Fechar tabela"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      
      <div className="flex items-center gap-2 mb-3">
        <Trophy className={cn("h-5 w-5", themeColors.icon)} />
        <span className="font-bold text-sm text-foreground">
          Distribuição de Acertos
          {concursoId && <span className="font-normal text-muted-foreground ml-1">#{concursoId}</span>}
        </span>
      </div>

      <div className="rounded-lg overflow-hidden border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/50">
              <TableHead className="text-xs font-semibold h-8 text-foreground">
                Faixa
              </TableHead>
              <TableHead className="text-xs font-semibold h-8 text-right text-foreground">
                Qtd
              </TableHead>
              <TableHead className="text-xs font-semibold h-8 text-right text-foreground">
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
                    "hover:bg-muted/30 transition-colors",
                    count > 0 && faixa.isPremio && "bg-muted/20"
                  )}
                >
                  <TableCell className="py-1.5 px-3">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      count > 0 ? faixa.className : "bg-muted text-muted-foreground"
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
                  <TableCell className="py-1.5 px-3 text-right text-xs text-muted-foreground">
                    {percent}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-2 text-xs text-center text-muted-foreground">
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
        icon: "text-purple-500",
        premioText: "text-purple-600 dark:text-purple-400",
      };
    case "megasena":
      return {
        icon: "text-green-500",
        premioText: "text-green-600 dark:text-green-400",
      };
    case "duplasena":
      return {
        icon: "text-orange-500",
        premioText: "text-orange-600 dark:text-orange-400",
      };
  }
}
