import { useState, useMemo } from "react";
import { Search, X, Plus, Minus, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TagFilterPopoverProps {
  allTags: string[];
  includeTags: string[];
  excludeTags: string[];
  exactMatch: boolean;
  onIncludeTagsChange: (tags: string[]) => void;
  onExcludeTagsChange: (tags: string[]) => void;
  onExactMatchChange: (value: boolean) => void;
  align?: "start" | "end";
}

function TagChip({
  tag,
  variant,
  onRemove,
}: {
  tag: string;
  variant: "include" | "exclude";
  onRemove: () => void;
}) {
  const styles = variant === "include"
    ? "bg-primary/10 text-primary border-primary/20 hover:border-primary/40"
    : "bg-destructive/10 text-destructive border-destructive/20 hover:border-destructive/40";

  return (
    <button
      onClick={onRemove}
      className={cn(
        "group inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors",
        styles
      )}
    >
      {tag}
      <X className="h-2.5 w-2.5 opacity-40 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function TagSearchSection({
  label,
  icon: Icon,
  iconColor,
  placeholder,
  selectedTags,
  allTags,
  variant,
  onToggle,
}: {
  label: string;
  icon: typeof Plus;
  iconColor: string;
  placeholder: string;
  selectedTags: string[];
  allTags: string[];
  variant: "include" | "exclude";
  onToggle: (tag: string) => void;
}) {
  const [search, setSearch] = useState("");

  const suggestions = useMemo(() => {
    if (!search) return [];
    return allTags.filter(
      (t) => t.toLowerCase().includes(search.toLowerCase()) && !selectedTags.includes(t)
    );
  }, [search, allTags, selectedTags]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3 w-3", iconColor)} />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <TagChip
              key={tag}
              tag={tag}
              variant={variant}
              onRemove={() => onToggle(tag)}
            />
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs pl-8 bg-muted/20 border-border/60 focus:bg-background transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {search && suggestions.length > 0 && (
        <div className="rounded-md border border-border/40 bg-card overflow-hidden max-h-32 overflow-y-auto">
          {suggestions.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                onToggle(tag);
                setSearch("");
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors border-b border-border/20 last:border-0"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {search && suggestions.length === 0 && (
        <p className="text-[10px] text-muted-foreground/50 pl-1 italic">
          Nenhuma tag encontrada
        </p>
      )}
    </div>
  );
}

export function TagFilterPopover({
  allTags,
  includeTags,
  excludeTags,
  exactMatch,
  onIncludeTagsChange,
  onExcludeTagsChange,
  onExactMatchChange,
  align = "end",
}: TagFilterPopoverProps) {
  const isActive = includeTags.length > 0 || excludeTags.length > 0;
  const activeCount = includeTags.length + excludeTags.length;

  const toggleInclude = (tag: string) => {
    onIncludeTagsChange(
      includeTags.includes(tag)
        ? includeTags.filter((t) => t !== tag)
        : [...includeTags, tag]
    );
  };

  const toggleExclude = (tag: string) => {
    onExcludeTagsChange(
      excludeTags.includes(tag)
        ? excludeTags.filter((t) => t !== tag)
        : [...excludeTags, tag]
    );
  };

  const clearAll = () => {
    onIncludeTagsChange([]);
    onExcludeTagsChange([]);
    onExactMatchChange(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 shrink-0 relative",
            isActive && "border-primary/40 bg-primary/5 text-primary"
          )}
        >
          <Tag className="h-4 w-4" />
          {isActive && (
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground rounded-full min-w-[16px] h-4 text-[10px] font-bold flex items-center justify-center px-0.5">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={8}
        className="p-4 w-[calc(100vw-2rem)] max-w-80"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Filtrar por tags</span>
            {isActive && (
              <button
                onClick={clearAll}
                className="text-[11px] text-primary hover:text-primary/80 font-medium"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Include */}
          <TagSearchSection
            label="Contém a tag"
            icon={Plus}
            iconColor="text-primary"
            placeholder="Buscar tag para incluir..."
            selectedTags={includeTags}
            allTags={allTags}
            variant="include"
            onToggle={toggleInclude}
          />

          <div className="border-t border-border/30" />

          {/* Exclude */}
          <TagSearchSection
            label="Não contém a tag"
            icon={Minus}
            iconColor="text-destructive"
            placeholder="Buscar tag para excluir..."
            selectedTags={excludeTags}
            allTags={allTags}
            variant="exclude"
            onToggle={toggleExclude}
          />

          {/* Exact match */}
          <div className="border-t border-border/30 pt-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-xs font-medium">Correspondência exata</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {exactMatch
                    ? "Deve ter TODAS as tags"
                    : "Deve ter QUALQUER tag"}
                </p>
              </div>
              <Switch checked={exactMatch} onCheckedChange={onExactMatchChange} />
            </label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
