/**
 * AdminSidebar - Sidebar de navegação para Desktop.
 * Visível apenas em telas 'md' (768px) ou superiores.
 * Consome 'adminNavConfig' como fonte de verdade para rotas.
 */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAdminBadges } from "@/hooks/useAdminBadges";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";
import {
  ChevronDown,
  Search,
  Zap,
  ArrowLeft,
  ChevronsRight,
  Video,
  type LucideIcon,
} from "lucide-react";
import { 
  adminNavConfig as sections, 
  type NavItem, 
  type NavSection, 
  type BadgeKey 
} from "@/config/adminNavConfig";
import { AppVersion } from "./AppVersion";




// ---------- Badge ----------
function NavBadge({ count, tone = "info" }: { count: number; tone?: "danger" | "info" }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex items-center justify-center rounded-full px-1.5 min-w-[1.1rem] h-[1.1rem] text-[10px] font-semibold leading-none",
        tone === "danger"
          ? "bg-destructive/15 text-destructive"
          : "bg-primary/15 text-primary"
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NovoBadge() {
  return (
    <span className="ml-auto inline-flex items-center justify-center rounded-full px-1.5 min-w-[1.6rem] h-[1.1rem] text-[9px] font-bold leading-none bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
      Novo
    </span>
  );
}

// ---------- Leaf nav item ----------
function NavLeaf({
  item,
  collapsed,
  isActive,
  badgeCount,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: (url: string, exact?: boolean) => boolean;
  badgeCount?: number;
}) {
  const active = isActive(item.url, item.exact);
  const content = (
    <Link to={item.url} aria-current={active ? "page" : undefined} className="relative">
      {active && !collapsed && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r bg-primary" />
      )}
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.title}</span>
      {badgeCount ? <NavBadge count={badgeCount} tone={item.badgeTone} /> : null}
      {item.isNew ? <NovoBadge /> : null}
    </Link>
  );

  if (collapsed) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
              {content}
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium flex items-center gap-2">
            {item.title}
            {badgeCount ? <NavBadge count={badgeCount} tone={item.badgeTone} /> : null}
            {item.isNew ? <NovoBadge /> : null}
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        className="transition-all hover:translate-x-0.5"
      >
        {content}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// ---------- Group with submenu ----------
function NavGroup({
  section,
  collapsed,
  isActive,
  badges,
}: {
  section: NavSection;
  collapsed: boolean;
  isActive: (url: string, exact?: boolean) => boolean;
  badges: ReturnType<typeof useAdminBadges>["data"];
}) {
  const GroupIcon = section.icon!;
  const groupActive = section.items.some((i) => isActive(i.url));
  const groupBadgeTotal = section.items.reduce(
    (sum, i) => sum + (i.badge ? badges?.[i.badge] ?? 0 : 0),
    0
  );
  const hasNewItem = section.items.some((i) => i.isNew);
  const shouldStartOpen = groupActive || section.id === "gravacao-mega-especial";

  if (collapsed) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Popover>
                <PopoverTrigger asChild>
                  <SidebarMenuButton
                    isActive={groupActive}
                    tooltip={section.label}
                    className="data-[state=open]:bg-sidebar-accent relative"
                  >
                    <GroupIcon className="h-4 w-4" />
                    <span>{section.label}</span>
                    {groupBadgeTotal > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
                    )}
                    {hasNewItem && (
                      <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </SidebarMenuButton>
                </PopoverTrigger>
                <PopoverContent side="right" align="start" sideOffset={8} className="p-1 w-60">
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.12em] flex items-center gap-1.5">
                    <GroupIcon className="h-3.5 w-3.5" />
                    {section.label}
                  </div>
                  <div className="h-px bg-border my-1" />
                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item) => {
                      const active = isActive(item.url, item.exact);
                      const count = item.badge ? badges?.[item.badge] ?? 0 : 0;
                      return (
                        <Link
                          key={item.url}
                          to={item.url}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
                            active && "bg-accent text-accent-foreground font-medium"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate flex-1">{item.title}</span>
                          {count ? <NavBadge count={count} tone={item.badgeTone} /> : null}
                          {item.isNew ? <NovoBadge /> : null}
                        </Link>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <Collapsible defaultOpen={shouldStartOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.12em] hover:text-foreground transition-colors group">
          <div className="flex items-center gap-1.5">
            <GroupIcon className="h-3 w-3" />
            <span>{section.label}</span>
            {groupBadgeTotal > 0 && (
              <NavBadge count={groupBadgeTotal} tone="danger" />
            )}
            {hasNewItem && <NovoBadge />}
          </div>
          <ChevronDown className="h-3 w-3 transition-transform group-data-[state=closed]:-rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <NavLeaf
                  key={item.url}
                  item={item}
                  collapsed={collapsed}
                  isActive={isActive}
                  badgeCount={item.badge ? badges?.[item.badge] ?? 0 : 0}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

// ---------- Header ----------
function AdminSidebarHeader({ collapsed }: { collapsed: boolean }) {
  return (
    <SidebarHeader className="border-b border-sidebar-border">
      <div
        className={cn(
          "flex items-center gap-2 px-1 py-1",
          collapsed && "justify-center"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
          <Zap className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold truncate">Painel</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">
                Admin
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground truncate">Palpite Tech</span>
          </div>
        )}
      </div>
    </SidebarHeader>
  );
}

// ---------- Search trigger ----------
function AdminSidebarSearch({
  collapsed,
  onOpen,
}: {
  collapsed: boolean;
  onOpen: () => void;
}) {
  if (collapsed) {
    return (
      <div className="px-1.5 py-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onOpen}
              className="flex h-8 w-full items-center justify-center rounded-md border border-sidebar-border bg-sidebar-accent/30 hover:bg-sidebar-accent transition-colors"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Buscar (Ctrl+K)</TooltipContent>
        </Tooltip>
      </div>
    );
  }
  return (
    <div className="px-2 py-2">
      <button
        onClick={onOpen}
        className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/30 px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Buscar página...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>
    </div>
  );
}

// ---------- Footer ----------
function AdminSidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const initials = (profile?.nome || user?.email || "A")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (collapsed) {
    return (
      <SidebarFooter className="border-t border-sidebar-border p-1.5 gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/")}
              className="flex h-8 w-full items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors"
              aria-label="Voltar ao app"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Voltar ao app</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/perfil"
              className="flex h-8 w-full items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors"
            >
              <Avatar className="h-7 w-7">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] bg-primary/15 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{profile?.nome || "Admin"}</TooltipContent>
        </Tooltip>
      </SidebarFooter>
    );
  }

  return (
    <SidebarFooter className="border-t border-sidebar-border p-2 gap-1.5">
      <Link
        to="/perfil"
        className="flex items-center gap-2 rounded-md p-1.5 hover:bg-sidebar-accent transition-colors"
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-primary/15 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium truncate">
              {profile?.nome || user?.email?.split("@")[0] || "Admin"}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-destructive/15 text-destructive">
              Admin
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground truncate block">
            {user?.email}
          </span>
          <AppVersion />
        </div>
      </Link>
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Voltar ao app</span>
      </button>
    </SidebarFooter>
  );
}

// ---------- Main ----------
export function AdminSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { data: badges } = useAdminBadges();

  const isActive = (url: string, exact?: boolean) => {
    if (exact) return currentPath === url;
    return currentPath.startsWith(url) && (url !== '/admin' || currentPath === '/admin');
  };


  return (
    <TooltipProvider delayDuration={100}>
      <Sidebar collapsible="none" className="border-r border-sidebar-border">
        <SidebarContent className="bg-gradient-to-b from-card via-card to-card/95 pb-3">
          <AdminSidebarHeader collapsed={collapsed} />
          <AdminSidebarSearch collapsed={collapsed} onOpen={() => setPaletteOpen(true)} />

          {!collapsed && (
            <div className="px-2 pb-1">
              <Link
                to="/admin/gravacao/mega-especial/08"
                className={cn(
                  "flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-2.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15",
                  currentPath.startsWith("/admin/gravacao/mega-especial") && "bg-primary/15"
                )}
              >
                <Video className="h-4 w-4 shrink-0" />
                <span className="truncate">Gravação Mega Especial</span>
                <NovoBadge />
              </Link>
            </div>
          )}

          {sections.map((section, idx) => {
            const isLast = idx === sections.length - 1;
            return (
              <div key={section.label ?? `inline-${idx}`}>
                {section.inline ? (
                  <SidebarGroup>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {section.items.map((item) => (
                          <NavLeaf
                            key={item.url}
                            item={item}
                            collapsed={collapsed}
                            isActive={isActive}
                            badgeCount={item.badge ? badges?.[item.badge] ?? 0 : 0}
                          />
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                ) : (
                  <NavGroup
                    section={section}
                    collapsed={collapsed}
                    isActive={isActive}
                    badges={badges}
                  />
                )}
                {collapsed && !isLast && (
                  <div className="h-px bg-sidebar-border/60 mx-2 my-0.5" />
                )}
              </div>
            );
          })}

          {/* Expand button when collapsed (extra to header trigger) */}
          {collapsed && (
            <div className="mt-auto px-1.5 pb-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={toggleSidebar}
                    className="flex h-7 w-full items-center justify-center rounded-md bg-sidebar-accent/40 hover:bg-sidebar-accent transition-colors"
                    aria-label="Expandir menu"
                  >
                    <ChevronsRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Expandir (Ctrl+B)</TooltipContent>
              </Tooltip>
            </div>
          )}
        </SidebarContent>

        <AdminSidebarFooter collapsed={collapsed} />
      </Sidebar>

      <AdminCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </TooltipProvider>
  );
}
