import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, X, ChevronsUpDown, Filter, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PlanOption {
  id: string;
  name: string;
}

interface TemplateSegmentationSectionProps {
  allTags: string[];
  includeTags: string[];
  excludeTags: string[];
  excludeTagsRecent: string[];
  excludeRecentWindowHours: number;
  tagsMatchMode: "any" | "all";
  planIds: string[];
  plans: PlanOption[];
  onIncludeTagsChange: (tags: string[]) => void;
  onExcludeTagsChange: (tags: string[]) => void;
  onExcludeTagsRecentChange: (tags: string[]) => void;
  onExcludeRecentWindowHoursChange: (hours: number) => void;
  onTagsMatchModeChange: (mode: "any" | "all") => void;
  onPlanIdsChange: (ids: string[]) => void;
}

export function TemplateSegmentationSection({
  allTags,
  includeTags,
  excludeTags,
  excludeTagsRecent,
  excludeRecentWindowHours,
  tagsMatchMode,
  planIds,
  plans,
  onIncludeTagsChange,
  onExcludeTagsChange,
  onExcludeTagsRecentChange,
  onExcludeRecentWindowHoursChange,
  onTagsMatchModeChange,
  onPlanIdsChange,
}: TemplateSegmentationSectionProps) {
  const [includeOpen, setIncludeOpen] = useState(false);
  const [excludeOpen, setExcludeOpen] = useState(false);
  const [excludeRecentOpen, setExcludeRecentOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const toggleTag = (tag: string, list: string[], setList: (tags: string[]) => void) => {
    setList(list.includes(tag) ? list.filter((t) => t !== tag) : [...list, tag]);
  };

  const togglePlan = (planId: string) => {
    onPlanIdsChange(
      planIds.includes(planId) ? planIds.filter((id) => id !== planId) : [...planIds, planId]
    );
  };

  const hasFilters = includeTags.length > 0 || excludeTags.length > 0 || planIds.length > 0;

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Label className="text-xs font-semibold text-muted-foreground">Segmentação (opcional)</Label>
        {hasFilters && (
          <Badge variant="secondary" className="text-[10px]">
            {[includeTags.length > 0 && `+${includeTags.length} tags`, excludeTags.length > 0 && `-${excludeTags.length} tags`, planIds.length > 0 && `${planIds.length} plano(s)`].filter(Boolean).join(", ")}
          </Badge>
        )}
      </div>

      {/* Include tags */}
      <div className="space-y-1.5">
        <Label className="text-xs">Contém as tags</Label>
        <Popover open={includeOpen} onOpenChange={setIncludeOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between font-normal min-h-[36px] h-auto text-xs">
              {includeTags.length === 0 ? (
                <span className="text-muted-foreground">Todas (sem filtro)</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {includeTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] gap-0.5">
                      {tag}
                      <X className="h-2.5 w-2.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleTag(tag, includeTags, onIncludeTagsChange); }} />
                    </Badge>
                  ))}
                </div>
              )}
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar tag..." />
              <CommandList>
                <CommandEmpty>Nenhuma tag.</CommandEmpty>
                <CommandGroup>
                  {allTags.map((tag) => (
                    <CommandItem key={tag} value={tag} onSelect={() => toggleTag(tag, includeTags, onIncludeTagsChange)}>
                      <Check className={cn("mr-2 h-3.5 w-3.5", includeTags.includes(tag) ? "opacity-100" : "opacity-0")} />
                      {tag}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Exclude tags */}
      <div className="space-y-1.5">
        <Label className="text-xs">Excluir quem tem as tags</Label>
        <Popover open={excludeOpen} onOpenChange={setExcludeOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between font-normal min-h-[36px] h-auto text-xs">
              {excludeTags.length === 0 ? (
                <span className="text-muted-foreground">Nenhuma exclusão</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {excludeTags.map((tag) => (
                    <Badge key={tag} variant="destructive" className="text-[10px] gap-0.5">
                      {tag}
                      <X className="h-2.5 w-2.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleTag(tag, excludeTags, onExcludeTagsChange); }} />
                    </Badge>
                  ))}
                </div>
              )}
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar tag..." />
              <CommandList>
                <CommandEmpty>Nenhuma tag.</CommandEmpty>
                <CommandGroup>
                  {allTags.map((tag) => (
                    <CommandItem key={tag} value={tag} onSelect={() => toggleTag(tag, excludeTags, onExcludeTagsChange)}>
                      <Check className={cn("mr-2 h-3.5 w-3.5", excludeTags.includes(tag) ? "opacity-100" : "opacity-0")} />
                      {tag}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Match mode */}
      {includeTags.length > 1 && (
        <div className="flex items-center gap-3">
          <Switch checked={tagsMatchMode === "all"} onCheckedChange={(v) => onTagsMatchModeChange(v ? "all" : "any")} />
          <Label className="text-xs">
            Correspondência: <span className="font-semibold">{tagsMatchMode === "all" ? "Todas (E)" : "Qualquer (OU)"}</span>
          </Label>
        </div>
      )}

      {/* Plans */}
      <div className="space-y-1.5">
        <Label className="text-xs">Apenas para plano(s)</Label>
        <Popover open={planOpen} onOpenChange={setPlanOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-full justify-between font-normal min-h-[36px] h-auto text-xs">
              {planIds.length === 0 ? (
                <span className="text-muted-foreground">Todos os planos</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {planIds.map((id) => {
                    const plan = plans.find((p) => p.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="text-[10px] gap-0.5">
                        {plan?.name || id}
                        <X className="h-2.5 w-2.5 cursor-pointer" onClick={(e) => { e.stopPropagation(); togglePlan(id); }} />
                      </Badge>
                    );
                  })}
                </div>
              )}
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar plano..." />
              <CommandList>
                <CommandEmpty>Nenhum plano.</CommandEmpty>
                <CommandGroup>
                  {plans.map((plan) => (
                    <CommandItem key={plan.id} value={plan.name} onSelect={() => togglePlan(plan.id)}>
                      <Check className={cn("mr-2 h-3.5 w-3.5", planIds.includes(plan.id) ? "opacity-100" : "opacity-0")} />
                      {plan.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
