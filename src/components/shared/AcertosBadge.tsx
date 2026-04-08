import { cn } from "@/lib/utils";

export type LoteriaType = "lotofacil" | "megasena" | "duplasena" | "quina";

interface AcertosBadgeProps {
  acertos: number;
  loteria: LoteriaType;
  showConcurso?: number | null;
  className?: string;
}

/**
 * Badge de acertos reutilizável para todas as loterias.
 * - Lotofácil: Roxo (11-15 pts premiados)
 * - Mega Sena: Verde (4-6 pts premiados)  
 * - Dupla Sena: Laranja (3-6 pts premiados)
 */
export function AcertosBadge({ 
  acertos, 
  loteria, 
  showConcurso,
  className 
}: AcertosBadgeProps) {
  const config = getLoteriaConfig(loteria, acertos);
  
  if (!config) return null;

  return (
    <span
      className={cn(
        "text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shrink-0",
        config.className,
        className
      )}
    >
      {config.isMaximo && <span>🏆</span>}
      <span>{acertos} pts</span>
      {showConcurso && (
        <span className="opacity-70 text-[9px]">#{showConcurso}</span>
      )}
    </span>
  );
}

function getLoteriaConfig(loteria: LoteriaType, acertos: number) {
  switch (loteria) {
    case "lotofacil":
      return getLotofacilConfig(acertos);
    case "megasena":
      return getMegaSenaConfig(acertos);
    case "duplasena":
      return getDuplaSenaConfig(acertos);
    case "quina":
      return getQuinaConfig(acertos);
    default:
      return null;
  }
}

function getLotofacilConfig(acertos: number) {
  // Lotofácil: 11-15 acertos são premiados
  const isPremio = acertos >= 11;
  const isMaximo = acertos === 15;

  let className = "bg-muted text-muted-foreground";
  
  if (isMaximo) {
    className = "bg-purple-500 text-white animate-pulse shadow-lg";
  } else if (acertos === 14) {
    className = "bg-purple-600 text-white";
  } else if (acertos === 13) {
    className = "bg-purple-700 text-white";
  } else if (acertos === 12) {
    className = "bg-purple-800 text-purple-50";
  } else if (acertos === 11) {
    className = "bg-purple-900 text-purple-100";
  }

  return { className, isPremio, isMaximo };
}

function getMegaSenaConfig(acertos: number) {
  // Mega Sena: 4-6 acertos são premiados
  const isPremio = acertos >= 4;
  const isMaximo = acertos === 6;

  let className = "bg-muted text-muted-foreground";
  
  if (isMaximo) {
    className = "bg-green-500 text-white animate-pulse shadow-lg";
  } else if (acertos === 5) {
    className = "bg-green-600 text-white";
  } else if (acertos === 4) {
    className = "bg-green-700 text-white";
  }

  return { className, isPremio, isMaximo };
}

function getDuplaSenaConfig(acertos: number) {
  // Dupla Sena: 3-6 acertos são premiados
  const isPremio = acertos >= 3;
  const isMaximo = acertos === 6;

  let className = "bg-muted text-muted-foreground";
  
  if (isMaximo) {
    className = "bg-orange-500 text-white animate-pulse shadow-lg";
  } else if (acertos === 5) {
    className = "bg-orange-600 text-white";
  } else if (acertos === 4) {
    className = "bg-orange-700 text-white";
  } else if (acertos === 3) {
    className = "bg-orange-800 text-orange-50";
  }

  return { className, isPremio, isMaximo };
}

function getQuinaConfig(acertos: number) {
  // Quina: 2-5 acertos são premiados
  const isPremio = acertos >= 2;
  const isMaximo = acertos === 5;

  let className = "bg-muted text-muted-foreground";
  
  if (isMaximo) {
    className = "bg-indigo-500 text-white animate-pulse shadow-lg";
  } else if (acertos === 4) {
    className = "bg-indigo-600 text-white";
  } else if (acertos === 3) {
    className = "bg-indigo-700 text-white";
  } else if (acertos === 2) {
    className = "bg-indigo-800 text-indigo-50";
  }

  return { className, isPremio, isMaximo };
}

/**
 * Verifica se o número de acertos é premiado para a loteria
 */
export function isPremiadoNaLoteria(acertos: number, loteria: LoteriaType): boolean {
  switch (loteria) {
    case "lotofacil":
      return acertos >= 11;
    case "megasena":
      return acertos >= 4;
    case "duplasena":
      return acertos >= 3;
    case "quina":
      return acertos >= 2;
    default:
      return false;
  }
}
