import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PeriodFilter } from "@/components/admin/dashboard/PeriodFilter";
import {
  CustomRange,
  PeriodKey,
} from "@/hooks/useDashboardPeriod";

export interface BlockPeriodState {
  override: boolean;
  periodKey: PeriodKey;
  customRange: CustomRange;
}

interface Props {
  state: BlockPeriodState;
  onChange: (next: BlockPeriodState) => void;
  /** Período global atual, usado como default quando "seguir global". */
  globalPeriodKey: PeriodKey;
  globalCustomRange: CustomRange;
}

/**
 * Controle de período por bloco. Por padrão "segue global"; ao escolher um
 * período local, ativa o override e mostra um botão para resetar.
 */
export function BlockPeriodControl({
  state,
  onChange,
  globalPeriodKey,
  globalCustomRange,
}: Props) {
  const resolvedKey = state.override ? state.periodKey : globalPeriodKey;
  const resolvedRange = state.override ? state.customRange : globalCustomRange;

  return (
    <div className="flex items-center gap-1.5">
      <PeriodFilter
        compact
        value={resolvedKey}
        onChange={(key) =>
          onChange({
            override: true,
            periodKey: key,
            customRange: state.customRange,
          })
        }
        customRange={resolvedRange}
        onCustomRangeChange={(range) =>
          onChange({
            override: true,
            periodKey: "custom",
            customRange: range,
          })
        }
      />
      {state.override && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
          onClick={() =>
            onChange({
              override: false,
              periodKey: globalPeriodKey,
              customRange: globalCustomRange,
            })
          }
          title="Voltar a seguir o filtro global"
        >
          <RotateCcw className="h-3 w-3" />
          Global
        </Button>
      )}
    </div>
  );
}

export const initialBlockPeriodState = (
  globalPeriodKey: PeriodKey,
  globalCustomRange: CustomRange,
): BlockPeriodState => ({
  override: false,
  periodKey: globalPeriodKey,
  customRange: globalCustomRange,
});
