import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PipelineHealthCard from "./monitor/PipelineHealthCard";

const PLACEHOLDERS = [
  "Auditoria do Prepare",
  "Instâncias × Grupos",
  "Histórico Detalhado",
] as const;

export default function MonitorGruposTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Monitor Grupos</h2>
        <p className="text-sm text-muted-foreground">
          Saúde do pipeline de disparo em grupo
        </p>
      </div>

      <PipelineHealthCard />

      {PLACEHOLDERS.map((title) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Em construção...</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
