import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Check, X, ChevronsUpDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { DisparoTagSelector } from "./DisparoTagSelector";
import type { PlanOption } from "@/hooks/useDisparoManual";

interface DisparoPublicoFilterProps {
  allTags: string[];
  includeTags: string[];
  excludeTags: string[];
  exactMatch: boolean;
  onToggleInclude: (tag: string) => void;
  onToggleExclude: (tag: string) => void;
  onExactMatchChange: (v: boolean) => void;

  plans: PlanOption[];
  selectedPlanIds: string[];
  onPlanToggle: (planId: string) => void;

  selectedStatus: string;
  onStatusChange: (v: string) => void;

  selectedVerification: "all" | "verified" | "unverified";
  onVerificationChange: (v: "all" | "verified" | "unverified") => void;

  eventTypes: string[];
  selectedEvent: string;
  onEventChange: (v: string) => void;

  contactCount: number | null;
  countLoading: boolean;

  activeFilters: string[];
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "ativa", label: "Ativa" },
  { value: "inativa", label: "Inativa" },
  { value: "vencida", label: "Vencida" },
];

const EVENT_LABELS: Record<string, string> = {
  novo_cadastro: "Novo Cadastro",
  carrinho_abandonado: "Carrinho Abandonado",
  subscription_expired: "Assinatura Expirada",
};

export function DisparoPublicoFilter({
  allTags,
  includeTags,
  excludeTags,
  exactMatch,
  onToggleInclude,
  onToggleExclude,
  onExactMatchChange,
  plans,
  selectedPlanIds,
  onPlanToggle,
  selectedStatus,
  onStatusChange,
  selectedVerification,
  onVerificationChange,
  eventTypes,
  selectedEvent,
  onEventChange,
  contactCount,
  countLoading,
  activeFilters,
}: DisparoPublicoFilterProps) {
  const [includeOpen, setIncludeOpen] = useState(false);
  const [excludeOpen, setExcludeOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <Users className="h-4 w-4" />
        Selecionar Público
      </h2>

      {/* Tags row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <DisparoTagSelector
          label="Contém as tags"
          selected={includeTags}
          allTags={allTags}
          onToggle={onToggleInclude}
          open={includeOpen}
          onOpenChange={setIncludeOpen}
        />
        <DisparoTagSelector
          label="Não contém as tags"
          selected={excludeTags}
          allTags={allTags}
          onToggle={onToggleExclude}
          open={excludeOpen}
          onOpenChange={setExcludeOpen}
        />
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={exactMatch} onCheckedChange={onExactMatchChange} />
        <Label className="text-xs">
          Correspondência exata: <span className="font-semibold">{exactMatch ? "E" : "OU"}</span>
        </Label>
      </div>

      {/* Advanced filters */}
      <div className="border-t border-border pt-4 space-y-4">
        <h3 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          Filtros Avançados
        </h3>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Plan selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Plano</Label>
            <Popover open={planOpen} onOpenChange={setPlanOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal min-h-[40px] h-auto"
                >
                  {selectedPlanIds.length === 0 ? (
                    <span className="text-muted-foreground">Todos os planos</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedPlanIds.map((id) => {
                        const plan = plans.find((p) => p.id === id);
                        return (
                          <Badge key={id} variant="secondary" className="text-[11px] gap-1">
                            {plan?.name || id}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPlanToggle(id);
                              }}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar plano..." />
                  <CommandList>
                    <CommandEmpty>Nenhum plano encontrado.</CommandEmpty>
                    <CommandGroup>
                      {plans.map((plan) => (
                        <CommandItem key={plan.id} value={plan.name} onSelect={() => onPlanToggle(plan.id)}>
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPlanIds.includes(plan.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {plan.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Status selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Status Assinatura</Label>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Evento Transacional</Label>
            <Select value={selectedEvent} onValueChange={onEventChange}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {eventTypes.map((evt) => (
                  <SelectItem key={evt} value={evt}>
                    {EVENT_LABELS[evt] || evt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Contact count + active filter badges */}
      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center gap-2">
          {countLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Badge variant="outline" className="text-xs">
              {contactCount ?? "—"} contatos encontrados
            </Badge>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeFilters.map((f, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {f}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
