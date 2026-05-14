import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FileText,
  Users,
  Gift,
  Activity,
  BarChart2,
  MessageCircle,
  Plug,
  DollarSign,
  PiggyBank,
  Smartphone,
  Receipt,
  ShoppingCart,
  PlusCircle,
  List,
  CreditCard,
  Trophy,
  Wallet,
  BarChart3,
  Database,
  type LucideIcon,
} from "lucide-react";

interface CmdItem {
  label: string;
  url: string;
  icon: LucideIcon;
  group: string;
  keywords?: string[];
  isNew?: boolean;
}

const ITEMS: CmdItem[] = [
  { label: "Painel", url: "/admin", icon: LayoutDashboard, group: "Principal", keywords: ["dashboard", "home"] },
  { label: "Planos", url: "/admin/planos", icon: FileText, group: "Principal" },
  { label: "Usuários", url: "/admin/usuarios", icon: Users, group: "Principal" },

  { label: "WhatsApp", url: "/admin/whatsapp", icon: MessageCircle, group: "Comunicação" },
  { label: "Convites", url: "/admin/convites", icon: Gift, group: "Comunicação" },
  { label: "Eventos", url: "/admin/eventos", icon: Activity, group: "Comunicação" },

  { label: "Custos IA", url: "/admin/custos", icon: DollarSign, group: "Financeiro" },
  { label: "Assinaturas Operacionais", url: "/admin/assinaturas-operacionais", icon: PiggyBank, group: "Financeiro" },
  { label: "Chip Celulares", url: "/admin/chip-celulares", icon: Smartphone, group: "Financeiro" },
  { label: "Custos Operacionais", url: "/admin/custos-operacionais", icon: Receipt, group: "Financeiro" },
  { label: "Vendas", url: "/admin/vendas", icon: ShoppingCart, group: "Financeiro" },

  { label: "Novo Bolão", url: "/admin/novo-bolao", icon: PlusCircle, group: "Bolões" },
  { label: "Listagem de Bolões", url: "/admin/listagem-bolao", icon: List, group: "Bolões" },
  { label: "Pagamentos de Bolões", url: "/admin/boloes-pagamento", icon: CreditCard, group: "Bolões" },
  { label: "Premiação", url: "/admin/premiacao", icon: Trophy, group: "Bolões" },
  { label: "Carteira", url: "/admin/carteira", icon: Wallet, group: "Bolões" },
  { label: "Solicitação de Resgate", url: "/admin/solicitacao-resgate", icon: Trophy, group: "Bolões" },
  { label: "Compras Saldo", url: "/admin/compras-saldo", icon: Wallet, group: "Bolões" },
  { label: "Compras Cotas", url: "/admin/compras-cotas", icon: CreditCard, group: "Bolões" },

  { label: "Gravação Lotofácil", url: "/admin/gravacao/lotofacil", icon: BarChart3, group: "Gravação" },
  { label: "Gravação Quina", url: "/admin/gravacao/quina", icon: BarChart3, group: "Gravação" },
  { label: "Gravação Mega-Sena", url: "/admin/gravacao/megasena", icon: BarChart3, group: "Gravação" },
  { label: "Gravação Mega 30 Anos", url: "/admin/gravacao/mega-30-anos", icon: BarChart3, group: "Gravação" },
  { label: "Mega Especial — Aula 01", url: "/admin/gravacao/mega-especial/01", icon: BarChart3, group: "Gravação Mega Especial", keywords: ["top dezenas"], isNew: true },
  { label: "Mega Especial — Aula 02", url: "/admin/gravacao/mega-especial/02", icon: BarChart3, group: "Gravação Mega Especial", keywords: ["top pares"], isNew: true },
  { label: "Mega Especial — Aula 03", url: "/admin/gravacao/mega-especial/03", icon: BarChart3, group: "Gravação Mega Especial", keywords: ["top impares ímpares"], isNew: true },
  { label: "Mega Especial — Aula 04", url: "/admin/gravacao/mega-especial/04", icon: BarChart3, group: "Gravação Mega Especial", keywords: ["top primos"], isNew: true },
  { label: "Mega Especial — Aula 05", url: "/admin/gravacao/mega-especial/05", icon: BarChart3, group: "Gravação Mega Especial", keywords: ["linhas quentes inicio fim geral"], isNew: true },
  { label: "Mega Especial — Aula 06", url: "/admin/gravacao/mega-especial/06", icon: BarChart3, group: "Gravação Mega Especial", keywords: ["colunas quentes inicio fim geral"], isNew: true },
  { label: "Mega Especial — Aula 07", url: "/admin/gravacao/mega-especial/07", icon: BarChart3, group: "Gravação Mega Especial", keywords: ["dezenas inicio menor par impar"], isNew: true },
  { label: "Mega Especial — Aula 08", url: "/admin/gravacao/mega-especial/08", icon: BarChart3, group: "Gravação Mega Especial", keywords: ["dezenas pares inicial final geral"], isNew: true },

  { label: "Métricas", url: "/admin/metricas", icon: BarChart2, group: "Sistema" },
  { label: "Integrações", url: "/admin/integracoes", icon: Plug, group: "Sistema" },
  { label: "Backfill Resultados", url: "/admin/backfill", icon: Database, group: "Sistema", keywords: ["importar", "historico", "mega sena", "xlsx"] },
];

interface AdminCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminCommandPalette({ open, onOpenChange }: AdminCommandPaletteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignora atalhos de teclado em dispositivos móveis (largura < 768px)
      if (window.innerWidth < 768) return;

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const grouped = ITEMS.reduce<Record<string, CmdItem[]>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar página do admin..." />
      <CommandList>
        <CommandEmpty>Nenhuma página encontrada.</CommandEmpty>
        {Object.entries(grouped).map(([group, items], idx) => (
          <div key={group}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map((item) => (
                <CommandItem
                  key={item.url}
                  value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                  onSelect={() => {
                    navigate(item.url);
                    onOpenChange(false);
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                  {item.isNew && (
                    <span className="ml-auto inline-flex items-center justify-center rounded-full px-1.5 min-w-[1.6rem] h-[1.1rem] text-[9px] font-bold leading-none bg-emerald-500/15 text-emerald-600 uppercase tracking-wide">
                      Novo
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
