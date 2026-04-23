import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { InstanciasTab } from "@/components/admin/whatsapp/InstanciasTab";
import { ProxiesTab } from "@/components/admin/whatsapp/ProxiesTab";
import { TemplatesTab } from "@/components/admin/whatsapp/TemplatesTab";
import { FilaTab } from "@/components/admin/whatsapp/FilaTab";
import { LogsTab } from "@/components/admin/whatsapp/LogsTab";
import { AquecimentoTab } from "@/components/admin/whatsapp/AquecimentoTab";
import { GruposTab } from "@/components/admin/whatsapp/GruposTab";
import { DisparoManualTab } from "@/components/admin/whatsapp/DisparoManualTab";
import { DisparoGrupoTab } from "@/components/admin/whatsapp/DisparoGrupoTab";
import { SmartLinksTab } from "@/components/admin/whatsapp/SmartLinksTab";
import { MensagensTab } from "@/components/admin/whatsapp/MensagensTab";
import { RetargetingPanelTab } from "@/components/admin/whatsapp/RetargetingPanelTab";
import { WhatsAppSubSidebar, whatsappTabs } from "@/components/admin/whatsapp/WhatsAppSubSidebar";
import { ForceUpdateButton } from "@/components/admin/ForceUpdateButton";
import { cn } from "@/lib/utils";

const TAB_TITLES: Record<string, string> = {
  instancias: "Instâncias",
  proxies: "Proxies",
  templates: "Templates",
  fila: "Fila de Envio",
  mensagens: "Mensagens",
  disparo: "Disparo Manual",
  logs: "Logs",
  retargeting: "Retargeting de Leads",
  "disparo-grupo": "Disparo Grupo",
  aquecimento: "Aquecimento",
  grupos: "Grupos",
  "smart-links": "Smart Links",
};

export default function AdminWhatsApp() {
  const [activeTab, setActiveTab] = useState("instancias");

  return (
    <AdminLayout pageTitle="WhatsApp">
      {/* Mobile: pill tabs */}
      <div className="overflow-x-auto px-4 pt-3 no-scrollbar md:hidden">
        <div className="flex gap-1.5 min-w-max">
          {whatsappTabs.map((tab) => (
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

      {/* Layout: sub-sidebar + content */}
      <div className="flex flex-1 min-h-0">
        <WhatsAppSubSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex-1 min-w-0 overflow-auto">
          {/* Content header (desktop only) */}
          <div className="hidden md:flex items-center gap-2 px-5 lg:px-6 pt-5 lg:pt-6 pb-1">
            <h2 className="text-lg font-semibold">{TAB_TITLES[activeTab] || activeTab}</h2>
          </div>

          <div className="p-4 md:px-5 md:pb-6 lg:px-6">
            <div className="max-w-5xl space-y-4">
              <ForceUpdateButton />
              {activeTab === "instancias" && <InstanciasTab />}
              {activeTab === "proxies" && <ProxiesTab />}
              {activeTab === "templates" && <TemplatesTab />}
              {activeTab === "fila" && <FilaTab />}
              {activeTab === "mensagens" && <MensagensTab />}
              {activeTab === "disparo" && <DisparoManualTab />}
              {activeTab === "logs" && <LogsTab />}
              {activeTab === "retargeting" && <RetargetingPanelTab />}
              {activeTab === "disparo-grupo" && <DisparoGrupoTab />}
              {activeTab === "aquecimento" && <AquecimentoTab />}
              {activeTab === "grupos" && <GruposTab />}
              {activeTab === "smart-links" && <SmartLinksTab />}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
