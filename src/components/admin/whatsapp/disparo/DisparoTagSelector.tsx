import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, X, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DisparoTagSelectorProps {
  label: string;
  selected: string[];
  allTags: string[];
  onToggle: (tag: string) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function DisparoTagSelector({ label, selected, allTags, onToggle, open, onOpenChange }: DisparoTagSelectorProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal min-h-[40px] h-auto"
          >
            {selected.length === 0 ? (
              <span className="text-muted-foreground">Selecionar tags...</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selected.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[11px] gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(tag);
                      }}
                    />
                  </Badge>
                ))}
              </div>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar tag..." />
            <CommandList>
              <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
              <CommandGroup>
                {allTags.map((tag) => (
                  <CommandItem key={tag} value={tag} onSelect={() => onToggle(tag)}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(tag) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {tag}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
