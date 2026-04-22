import { Smartphone, FileText, Send, ScrollText, Flame, Users, Megaphone, MessageSquare, Link2, Target, Inbox, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { value: "instancias", label: "Instâncias", icon: Smartphone },
  { value: "proxies", label: "Proxies", icon: Globe },
  { value: "templates", label: "Templates", icon: FileText },
  { value: "fila", label: "Fila", icon: Send },
  { value: "mensagens", label: "Mensagens", icon: Inbox },
  { value: "disparo", label: "Disparo Manual", icon: Megaphone },
  { value: "logs", label: "Logs", icon: ScrollText },
  { value: "retargeting", label: "Retargeting", icon: Target },
  { value: "disparo-grupo", label: "Disparo Grupo", icon: Send },
  { value: "aquecimento", label: "Aquecimento", icon: Flame },
  { value: "grupos", label: "Grupos", icon: Users },
  { value: "smart-links", label: "Smart Links", icon: Link2 },
] as const;

interface WhatsAppSubSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function WhatsAppSubSidebar({ activeTab, onTabChange }: WhatsAppSubSidebarProps) {
  return (
    <nav className="w-[180px] shrink-0 border-r border-border bg-card/40 hidden md:flex md:flex-col">
      {/* Mini header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
        <MessageSquare className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">WhatsApp</span>
      </div>

      {/* Nav items */}
      <ul className="space-y-0.5 px-2 py-2 flex-1">
        {items.map((item) => (
          <li key={item.value}>
            <button
              onClick={() => onTabChange(item.value)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                activeTab === item.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export { items as whatsappTabs };
