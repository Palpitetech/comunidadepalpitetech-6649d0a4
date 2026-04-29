import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton para o bloco de KPIs (8 cards em grid). */
export function KPIsSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-32" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between mb-1.5">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-7 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Skeleton genérico de card com tabela. */
export function TableCardSkeleton({
  titleWidth = "w-48",
  rows = 5,
  cols = 6,
}: {
  titleWidth?: string;
  rows?: number;
  cols?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between gap-2 flex-wrap">
        <Skeleton className={`h-5 ${titleWidth}`} />
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {/* Header row */}
          <div className="grid gap-2 px-4 py-2 border-b" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-16" />
            ))}
          </div>
          {/* Body rows */}
          {Array.from({ length: rows }).map((_, r) => (
            <div
              key={r}
              className="grid gap-2 px-4 py-3 border-b last:border-0"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
            >
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton key={c} className="h-4 w-full max-w-[80px]" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Skeleton específico para First vs Last (KPIs de cobertura + controles + tabela). */
export function FirstVsLastSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-5 w-56" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-3 space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-8 w-72" />
        </div>
        <div className="border rounded-lg">
          {Array.from({ length: 5 }).map((_, r) => (
            <div
              key={r}
              className="grid grid-cols-6 gap-2 px-4 py-3 border-b last:border-0"
            >
              {Array.from({ length: 6 }).map((_, c) => (
                <Skeleton key={c} className="h-4 w-full max-w-[80px]" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Skeleton para o bloco do Funil (texto monoespaçado). */
export function FunnelSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between gap-2 flex-wrap">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-7 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2 bg-muted/40 rounded-lg p-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}
