import { Smartphone, FileText, Send, ScrollText, Flame, Users, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { value: "instancias", label: "Instâncias", icon: Smartphone },
  { value: "templates", label: "Templates", icon: FileText },
  { value: "fila", label: "Fila", icon: Send },
  { value: "disparo", label: "Disparo Manual", icon: Megaphone },
  { value: "logs", label: "Logs", icon: ScrollText },
  { value: "disparo-grupo", label: "Disparo Grupo", icon: Send },
  { value: "aquecimento", label: "Aquecimento", icon: Flame },
  { value: "grupos", label: "Grupos", icon: Users },
] as const;

interface WhatsAppSubSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function WhatsAppSubSidebar({ activeTab, onTabChange }: WhatsAppSubSidebarProps) {
  return (
    <nav className="w-[200px] shrink-0 border-r border-border bg-card/50 py-2 hidden md:block">
      <ul className="space-y-0.5 px-2">
        {items.map((item) => (
          <li key={item.value}>
            <button
              onClick={() => onTabChange(item.value)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                activeTab === item.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export { items as whatsappTabs };
