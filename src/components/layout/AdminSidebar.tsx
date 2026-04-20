import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  Bot,
  DollarSign,
  PiggyBank,
  Gift,
  ShoppingCart,
  Activity,
  BarChart2,
  Plug,
  MessageCircle,
  Smartphone,
  Receipt,
  Ticket,
  PlusCircle,
  List,
  CreditCard,
  Trophy,
  Wallet,
  Video,
  BarChart3,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  exact?: boolean;
}

const mainItems: NavItem[] = [
  { title: "Painel", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Planos", url: "/admin/planos", icon: FileText },
  { title: "Usuários", url: "/admin/usuarios", icon: Users },
  { title: "Bots", url: "/admin/bots", icon: Bot },
  { title: "Convites", url: "/admin/convites", icon: Gift },
  { title: "Eventos", url: "/admin/eventos", icon: Activity },
  { title: "Métricas", url: "/admin/metricas", icon: BarChart2 },
  { title: "WhatsApp", url: "/admin/whatsapp", icon: MessageCircle },
  { title: "Integrações", url: "/admin/integracoes", icon: Plug },
];

const financeiroItems: NavItem[] = [
  { title: "Custos IA", url: "/admin/custos", icon: DollarSign },
  { title: "Assinaturas Op.", url: "/admin/assinaturas-operacionais", icon: PiggyBank },
  { title: "Chip Celulares", url: "/admin/chip-celulares", icon: Smartphone },
  { title: "Custos Operacionais", url: "/admin/custos-operacionais", icon: Receipt },
  { title: "Vendas", url: "/admin/vendas", icon: ShoppingCart },
];

const boloesItems: NavItem[] = [
  { title: "Novo Bolão", url: "/admin/novo-bolao", icon: PlusCircle },
  { title: "Listagem", url: "/admin/listagem-bolao", icon: List },
  { title: "Pagamentos", url: "/admin/boloes-pagamento", icon: CreditCard },
  { title: "Premiação", url: "/admin/premiacao", icon: Trophy },
  { title: "Carteira", url: "/admin/carteira", icon: Wallet },
  { title: "Resgates", url: "/admin/solicitacao-resgate", icon: Trophy },
  { title: "Compras Saldo", url: "/admin/compras-saldo", icon: Wallet },
  { title: "Compras Cotas", url: "/admin/compras-cotas", icon: CreditCard },
];

const gravacaoItems: NavItem[] = [
  { title: "Lotofácil", url: "/admin/gravacao/lotofacil", icon: BarChart3 },
  { title: "Quina", url: "/admin/gravacao/quina", icon: BarChart3 },
];

// Render a single nav item with tooltip when collapsed
function NavLeaf({
  item,
  collapsed,
  isActive,
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: (url: string, exact?: boolean) => boolean;
}) {
  const active = isActive(item.url, item.exact);

  if (collapsed) {
    return (
      <SidebarMenuItem>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
              <Link to={item.url}>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <Link to={item.url}>
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// Render a group: collapsible when expanded, popover (flyout) when collapsed
function NavGroup({
  label,
  icon: GroupIcon,
  items,
  collapsed,
  isActive,
}: {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  collapsed: boolean;
  isActive: (url: string, exact?: boolean) => boolean;
}) {
  const groupActive = items.some((i) => isActive(i.url));

  if (collapsed) {
    // Flyout submenu via Popover (hover/click on icon)
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Popover>
                <PopoverTrigger asChild>
                  <SidebarMenuButton
                    isActive={groupActive}
                    tooltip={label}
                    className="data-[state=open]:bg-sidebar-accent"
                  >
                    <GroupIcon className="h-4 w-4" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
                  sideOffset={8}
                  className="p-1 w-56"
                >
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <GroupIcon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                  <div className="h-px bg-border my-1" />
                  <div className="flex flex-col gap-0.5">
                    {items.map((item) => {
                      const active = isActive(item.url, item.exact);
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
                          <span className="truncate">{item.title}</span>
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

  // Expanded: keep classic collapsible behavior
  return (
    <SidebarGroup>
      <Collapsible defaultOpen={groupActive}>
        <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
          <div className="flex items-center gap-1.5">
            <GroupIcon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </div>
          <ChevronDown className="h-3 w-3" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <NavLeaf
                  key={item.url}
                  item={item}
                  collapsed={collapsed}
                  isActive={isActive}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (url: string, exact?: boolean) =>
    exact ? currentPath === url : currentPath === url || currentPath.startsWith(url + "/");

  return (
    <TooltipProvider delayDuration={200}>
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarContent className="bg-card">
          {/* Main Nav */}
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs text-destructive font-bold uppercase tracking-wider">
                Admin
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <NavLeaf
                    key={item.url}
                    item={item}
                    collapsed={collapsed}
                    isActive={isActive}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <NavGroup
            label="Financeiro"
            icon={DollarSign}
            items={financeiroItems}
            collapsed={collapsed}
            isActive={isActive}
          />

          <NavGroup
            label="Bolões"
            icon={Ticket}
            items={boloesItems}
            collapsed={collapsed}
            isActive={isActive}
          />

          <NavGroup
            label="Gravação"
            icon={Video}
            items={gravacaoItems}
            collapsed={collapsed}
            isActive={isActive}
          />
        </SidebarContent>
      </Sidebar>
    </TooltipProvider>
  );
}
