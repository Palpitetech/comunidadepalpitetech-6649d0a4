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
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Wrench,
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
  ArrowLeft,
} from "lucide-react";

const mainItems = [
  { title: "Painel", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Planos", url: "/admin/planos", icon: FileText },
  { title: "Usuários", url: "/admin/usuarios", icon: Users },
  { title: "Bots", url: "/admin/bots", icon: Bot },
  { title: "Convites", url: "/admin/convites", icon: Gift },
  { title: "Eventos", url: "/admin/eventos", icon: Activity },
  { title: "Métricas", url: "/admin/metricas", icon: BarChart2 },
  { title: "WhatsApp", url: "/admin/whatsapp", icon: MessageCircle },
  { title: "Integrações", url: "/admin/integracoes", icon: Plug },
  { title: "Manutenção", url: "/admin/manutencao", icon: Wrench },
];

const financeiroItems = [
  { title: "Custos IA", url: "/admin/custos", icon: DollarSign },
  { title: "Assinaturas Op.", url: "/admin/assinaturas-operacionais", icon: PiggyBank },
  { title: "Chip Celulares", url: "/admin/chip-celulares", icon: Smartphone },
  { title: "Custos Operacionais", url: "/admin/custos-operacionais", icon: Receipt },
  { title: "Vendas", url: "/admin/vendas", icon: ShoppingCart },
];

const boloesItems = [
  { title: "Novo Bolão", url: "/admin/novo-bolao", icon: PlusCircle },
  { title: "Listagem", url: "/admin/listagem-bolao", icon: List },
  { title: "Pagamentos", url: "/admin/boloes-pagamento", icon: CreditCard },
  { title: "Premiação", url: "/admin/premiacao", icon: Trophy },
  { title: "Carteira", url: "/admin/carteira", icon: Wallet },
  { title: "Resgates", url: "/admin/solicitacao-resgate", icon: Trophy },
  { title: "Compras Saldo", url: "/admin/compras-saldo", icon: Wallet },
  { title: "Compras Cotas", url: "/admin/compras-cotas", icon: CreditCard },
];

const gravacaoItems = [
  { title: "Lotofácil", url: "/admin/gravacao/lotofacil", icon: BarChart3 },
  { title: "Quina", url: "/admin/gravacao/quina", icon: BarChart3 },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (url: string, exact?: boolean) =>
    exact ? currentPath === url : currentPath === url || currentPath.startsWith(url + "/");

  const boloesOpen = boloesItems.some((i) => isActive(i.url));
  const gravacaoOpen = gravacaoItems.some((i) => isActive(i.url));

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card">

        {/* Main Nav */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-destructive font-bold uppercase tracking-wider">
            Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url, item.exact)}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bolões */}
        <SidebarGroup>
          <Collapsible defaultOpen={boloesOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
              <div className="flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5" />
                {!collapsed && <span>Bolões</span>}
              </div>
              {!collapsed && <ChevronDown className="h-3 w-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {boloesItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                      >
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Gravação */}
        <SidebarGroup>
          <Collapsible defaultOpen={gravacaoOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
              <div className="flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5" />
                {!collapsed && <span>Gravação</span>}
              </div>
              {!collapsed && <ChevronDown className="h-3 w-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {gravacaoItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                      >
                        <Link to={item.url}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
