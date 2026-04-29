import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PipelineHealthCard from "./monitor/PipelineHealthCard";
import PrepareAuditTable from "./monitor/PrepareAuditTable";
import InstanceGroupMatrix from "./monitor/InstanceGroupMatrix";

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
      <PrepareAuditTable />
      <InstanceGroupMatrix />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Em construção...</p>
        </CardContent>
      </Card>
    </div>
  );
}
