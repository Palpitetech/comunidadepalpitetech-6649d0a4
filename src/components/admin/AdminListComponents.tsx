import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Search, X, RefreshCw, Filter, CalendarDays, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ptBR } from "date-fns/locale";

/**
 * AdminHeader - Header padronizado para todas as páginas admin.
 */
interface AdminHeaderProps {
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  filters?: {
    label: string;
    isActive: boolean;
    onClick: () => void;
    icon?: any;
    count?: number;
  }[];
  customFilterContent?: ReactNode;
    range: any;
    onRangeChange: (range: any) => void;
    isActive: boolean;
    onClear: () => void;
  };
}

export function AdminHeader({
  title,
  search,
  onSearchChange,
  onRefresh,
  loading,
  filters,
  dateFilter
}: AdminHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-3 max-w-7xl mx-auto w-full">
        <div className="flex-1 max-w-[240px] md:max-w-md relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Buscar..." 
            value={search} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="pl-9 h-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all" 
          />
          {search && (
            <button 
              onClick={() => onSearchChange("")} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {dateFilter && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-xl border-border/50 bg-background hover:bg-muted/50 transition-all",
                    dateFilter.isActive && "border-primary/40 bg-primary/5 text-primary"
                  )}
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0" sideOffset={8}>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-sm font-semibold">Filtrar por data</span>
                  {dateFilter.isActive && (
                    <button onClick={dateFilter.onClear} className="text-[11px] text-primary hover:text-primary/80 font-medium">
                      Limpar
                    </button>
                  )}
                </div>
                <CalendarComponent
                  mode="range"
                  selected={dateFilter.range}
                  onSelect={dateFilter.onRangeChange}
                  numberOfMonths={window.innerWidth > 768 ? 2 : 1}
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}

          {filters && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl border-border/50 bg-background hover:bg-muted/50 transition-all"
                >
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filtrar {title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filters.map((filter, idx) => {
                  const Icon = filter.icon;
                  return (
                    <DropdownMenuItem 
                      key={idx} 
                      onClick={filter.onClick}
                      className={cn(filter.isActive && "bg-accent")}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      <span>{filter.label}</span>
                      {filter.count !== undefined && filter.count > 0 && (
                        <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                          {filter.count}
                        </span>
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-xl border-border/50 bg-background hover:bg-muted/50 transition-all"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 text-muted-foreground", loading && "animate-spin")} />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * AdminListContainer - Wrapper padronizado para listagens admin densas.
 */
export function AdminListContainer({ 
  children, 
  className,
  loading,
  emptyMessage = "Nenhum registro encontrado"
}: { 
  children: ReactNode; 
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
}) {
  if (loading && (!children || (Array.isArray(children) && children.length === 0))) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Sincronizando dados...</p>
      </div>
    );
  }

  if (!loading && (!children || (Array.isArray(children) && children.length === 0))) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
        <Search className="h-6 w-6 text-muted-foreground/20" />
        <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("divide-y divide-border/40 border-b border-border/40", className)}>
      {children}
    </div>
  );
}

interface AdminListItemProps {
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    color: string;
    icon?: any;
  };
  timestamp?: string;
  onClick?: () => void;
  rightContent?: ReactNode;
}

/**
 * AdminListItem - Item de linha ultra-compacto seguindo o Design System de Logs.
 */
export function AdminListItem({ 
  title, 
  subtitle, 
  badge, 
  timestamp, 
  onClick,
  rightContent 
}: AdminListItemProps) {
  const StatusIcon = badge?.icon;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 py-2.5 px-4 hover:bg-muted/30 active:bg-muted/50 transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 leading-tight">
          <span className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">
            {title}
          </span>
          
          {badge && (
            <div className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tight border shrink-0",
              badge.color
            )}>
              {StatusIcon && <StatusIcon className="h-2.5 w-2.5" />}
              {badge.text}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-1 leading-tight">
          <span className="text-[11px] text-muted-foreground/70 truncate italic text-left">
            {subtitle}
          </span>
          
          <div className="flex items-center gap-2 shrink-0">
            {rightContent}
            {timestamp && (
              <span className="text-[10px] font-medium text-muted-foreground/50 whitespace-nowrap shrink-0">
                {timestamp}
              </span>
            )}
          </div>
        </div>
      </div>

      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors shrink-0 ml-1" />
    </button>
  );
}

/**
 * AdminPagination - Paginação padronizada ultra-compacta.
 */
export function AdminPagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  hasNextPage,
  hasPrevPage,
  totalPages
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-muted/5">
      <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
        {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalCount)} <span className="mx-1">/</span> {totalCount.toLocaleString("pt-BR")}
      </p>
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 hover:bg-muted" 
          disabled={!hasPrevPage} 
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
        <span className="text-[10px] font-bold w-8 text-center">{page + 1}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 hover:bg-muted" 
          disabled={!hasNextPage} 
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}

