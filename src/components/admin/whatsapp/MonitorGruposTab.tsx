// Aba Monitor Grupos: visão consolidada da saúde do pipeline de disparo em grupo.
import { PipelineHealthCard, PrepareAuditTable, InstanceGroupMatrix } from "./monitor";
import { GroupBlastLogsCard } from "./GroupBlastLogsCard";
import { useGroupBlastConfigs } from "@/hooks/useGroupBlastConfigs";
import { UnifiedLayout } from "./UnifiedLayout";

export function MonitorGruposTab() {
  const { configs } = useGroupBlastConfigs();

  return (
    <UnifiedLayout>
      <div className="space-y-6">
        <PipelineHealthCard />
        <PrepareAuditTable />
        <InstanceGroupMatrix />
        <GroupBlastLogsCard configs={configs.map((c) => ({ id: c.id, name: c.name }))} />
      </div>
    </UnifiedLayout>
  );
}

export default MonitorGruposTab;
