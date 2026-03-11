import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Smartphone, FileText, Send, ScrollText, Flame, Users } from "lucide-react";
import { InstanciasTab } from "@/components/admin/whatsapp/InstanciasTab";
import { TemplatesTab } from "@/components/admin/whatsapp/TemplatesTab";
import { FilaTab } from "@/components/admin/whatsapp/FilaTab";
import { LogsTab } from "@/components/admin/whatsapp/LogsTab";
import { AquecimentoTab } from "@/components/admin/whatsapp/AquecimentoTab";
import { GruposTab } from "@/components/admin/whatsapp/GruposTab";
import { cn } from "@/lib/utils";

const tabs = [
  { value: "instancias", label: "Instâncias", icon: Smartphone },
  { value: "templates", label: "Templates", icon: FileText },
  { value: "fila", label: "Fila", icon: Send },
  { value: "logs", label: "Logs", icon: ScrollText },
  { value: "aquecimento", label: "Aquecimento", icon: Flame },
  { value: "grupos", label: "Grupos", icon: Users },
] as const;

export default function AdminWhatsApp() {
  const [activeTab, setActiveTab] = useState("instancias");

  return (
    <MainLayout>
      <div className="container-senior py-4 sm:py-6 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">WhatsApp</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie instâncias, templates e envios</p>
        </div>

        {/* Scrollable pill tabs for mobile */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
          <div className="flex gap-1.5 min-w-max sm:min-w-0 sm:flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-secondary"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "instancias" && <InstanciasTab />}
          {activeTab === "templates" && <TemplatesTab />}
          {activeTab === "fila" && <FilaTab />}
          {activeTab === "logs" && <LogsTab />}
          {activeTab === "aquecimento" && <AquecimentoTab />}
          {activeTab === "grupos" && <GruposTab />}
        </div>
      </div>
    </MainLayout>
  );
}
