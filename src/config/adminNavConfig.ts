/**
 * adminNavConfig - Fonte única de verdade para a navegação do painel Admin.
 * Compartilhada entre AdminSidebar (Desktop) e AdminMobileDrawer (Mobile).
 */
import {
  LayoutDashboard,
  FileText,
  Users,
  Radio,
  MessageCircle,
  Gift,
  Activity,
  DollarSign,
  PiggyBank,
  Smartphone,
  Receipt,
  ShoppingCart,
  Ticket,
  PlusCircle,
  List,
  CreditCard,
  Trophy,
  Wallet,
  Video,
  BarChart3,
  BarChart2,
  Plug,
  Database,
  RefreshCw,
  Settings,
  type LucideIcon,
} from "lucide-react";



export type BadgeKey = "usuarios" | "pagamentos" | "resgates" | "chat";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: BadgeKey;
  badgeTone?: "danger" | "info";
}

export interface NavSection {
  id: string;
  label?: string;
  icon?: LucideIcon;
  items: NavItem[];
  inline?: boolean;
}

export const adminNavConfig: NavSection[] = [
  {
    id: "principal",
    inline: true,
    items: [
      { title: "Painel", url: "/admin", icon: LayoutDashboard, exact: true },
      { title: "Planos", url: "/admin/planos", icon: FileText },
      { title: "Usuários", url: "/admin/usuarios", icon: Users, badge: "usuarios", badgeTone: "info" },
    ],
  },
  {
    id: "comunicacao",
    label: "Comunicação",
    icon: Radio,
    items: [
      { title: "Chat Central", url: "/admin/chat", icon: MessageCircle, badge: "chat", badgeTone: "danger" },
      { title: "WhatsApp", url: "/admin/whatsapp", icon: Radio },
      { title: "Convites", url: "/admin/convites", icon: Gift },
      { title: "Eventos", url: "/admin/eventos", icon: Activity },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: DollarSign,
    items: [
      { title: "Custos IA", url: "/admin/custos", icon: DollarSign },
      { title: "Assinaturas Op.", url: "/admin/assinaturas-operacionais", icon: PiggyBank },
      { title: "Chip Celulares", url: "/admin/chip-celulares", icon: Smartphone },
      { title: "Custos Operacionais", url: "/admin/custos-operacionais", icon: Receipt },
      { title: "Vendas", url: "/admin/vendas", icon: ShoppingCart },
    ],
  },
  {
    id: "boloes",
    label: "Bolões",
    icon: Ticket,
    items: [
      { title: "Novo Bolão", url: "/admin/novo-bolao", icon: PlusCircle },
      { title: "Listagem", url: "/admin/listagem-bolao", icon: List },
      { title: "Pagamentos", url: "/admin/boloes-pagamento", icon: CreditCard, badge: "pagamentos", badgeTone: "danger" },
      { title: "Premiação", url: "/admin/premiacao", icon: Trophy },
      { title: "Carteira", url: "/admin/carteira", icon: Wallet },
      { title: "Resgates", url: "/admin/solicitacao-resgate", icon: Trophy, badge: "resgates", badgeTone: "danger" },
      { title: "Compras Saldo", url: "/admin/compras-saldo", icon: Wallet },
      { title: "Compras Cotas", url: "/admin/compras-cotas", icon: CreditCard },
    ],
  },
  {
    id: "gravacao-resultado",
    label: "Gravação Resultado",
    icon: Video,
    items: [
      { title: "Lotofácil", url: "/admin/gravacao/resultado/lotofacil", icon: BarChart3 },
      { title: "Quina", url: "/admin/gravacao/resultado/quina", icon: BarChart3 },
      { title: "Mega-Sena", url: "/admin/gravacao/resultado/megasena", icon: BarChart3 },
    ],
  },
  {
    id: "gravacao-estudos",
    label: "Gravação Estudos",
    icon: Video,
    items: [
      { title: "Lotofácil", url: "/admin/gravacao/estudos/lotofacil", icon: BarChart3 },
      { title: "Mega-Sena", url: "/admin/gravacao/estudos/megasena", icon: BarChart3 },
    ],
  },
  {
    id: "gravacao-mega-especial",
    label: "Gravação Mega Especial",
    icon: Video,
    items: [
      { title: "Aula 01 — Top dezenas", url: "/admin/gravacao/mega-especial/01", icon: BarChart3 },
      { title: "Aula 02 — Top pares", url: "/admin/gravacao/mega-especial/02", icon: BarChart3 },
      { title: "Aula 03 — Top ímpares", url: "/admin/gravacao/mega-especial/03", icon: BarChart3 },
      { title: "Aula 04 — Top primos", url: "/admin/gravacao/mega-especial/04", icon: BarChart3 },
      { title: "Aula 05 — Linhas quentes", url: "/admin/gravacao/mega-especial/05", icon: BarChart3 },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    icon: Settings,
    items: [
      { title: "Métricas", url: "/admin/metricas", icon: BarChart2 },
      { title: "Integrações", url: "/admin/integracoes", icon: Plug },
      { title: "Backfill Resultados", url: "/admin/backfill", icon: Database },
      { title: "Forçar Atualização", url: "/admin/force-update", icon: RefreshCw },
    ],
  },

];
