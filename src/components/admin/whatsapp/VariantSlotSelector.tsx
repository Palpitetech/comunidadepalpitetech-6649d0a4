import { Plus, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface VariantSlot {
  position: number; // 1-10
  content: string;
  isActive: boolean;
  timesUsed: number;
  exists: boolean; // slot 1 always exists; slots 2-10 exist when content was created
}

interface VariantSlotSelectorProps {
  slots: VariantSlot[];
  activeSlot: number;
  onSelect: (position: number) => void;
}

export function VariantSlotSelector({ slots, activeSlot, onSelect }: VariantSlotSelectorProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        role="tablist"
        aria-label="Selecionar variação da mensagem"
        className="flex flex-wrap gap-1.5"
      >
        {slots.map((slot) => {
          const isSelected = slot.position === activeSlot;
          const isMain = slot.position === 1;
          const empty = !slot.exists;

          let tooltipText: string;
          if (isMain) {
            tooltipText = "Mensagem principal (sempre ativa)";
          } else if (empty) {
            tooltipText = `Variação #${slot.position} — clique para criar`;
          } else {
            tooltipText = `Variação #${slot.position} — ${
              slot.isActive ? "Ativa" : "Pausada"
            } · enviada ${slot.timesUsed}×`;
          }

          return (
            <Tooltip key={slot.position}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-label={tooltipText}
                  onClick={() => onSelect(slot.position)}
                  className={cn(
                    "relative h-11 w-11 sm:h-10 sm:w-10 rounded-md border text-xs font-semibold",
                    "flex items-center justify-center transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isSelected && "ring-2 ring-ring ring-offset-2",
                    empty && !isMain && "border-dashed border-border bg-muted/30 text-muted-foreground hover:bg-muted/60",
                    !empty && slot.isActive && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20",
                    !empty && !slot.isActive && "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20",
                    isMain && "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20",
                  )}
                >
                  {empty && !isMain ? (
                    <Plus className="h-4 w-4" />
                  ) : (
                    <>
                      <span>{slot.position}</span>
                      {!isMain && !slot.isActive && (
                        <Pause className="absolute -top-1 -right-1 h-3 w-3 bg-background rounded-full p-0.5" />
                      )}
                    </>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {tooltipText}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
