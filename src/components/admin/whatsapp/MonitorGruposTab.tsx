// Aba Monitor Grupos: visão consolidada da saúde do pipeline de disparo em grupo.
import { PipelineHealthCard, PrepareAuditTable, InstanceGroupMatrix } from "./monitor";
import { GroupBlastLogsCard } from "./GroupBlastLogsCard";
import { useGroupBlastConfigs } from "@/hooks/useGroupBlastConfigs";

export default function MonitorGruposTab() {
  const { configs } = useGroupBlastConfigs();

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h2 className="text-xl font-semibold">Monitor Grupos</h2>
        <p className="text-sm text-muted-foreground">
          Saúde do pipeline de disparo em grupo
        </p>
      </div>

      <PipelineHealthCard />
      <PrepareAuditTable />
      <InstanceGroupMatrix />
      <GroupBlastLogsCard configs={configs.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
