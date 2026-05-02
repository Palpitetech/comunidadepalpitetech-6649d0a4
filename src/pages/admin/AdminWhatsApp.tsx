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
import MonitorGruposTab from "@/components/admin/whatsapp/MonitorGruposTab";
import { SmartLinksTab } from "@/components/admin/whatsapp/SmartLinksTab";
import { MensagensTab } from "@/components/admin/whatsapp/MensagensTab";
import { RetargetingPanelTab } from "@/components/admin/whatsapp/RetargetingPanelTab";
import { EmailTemplatesTab } from "@/components/admin/email/EmailTemplatesTab";
import { EmailFilaTab } from "@/components/admin/email/EmailFilaTab";
import { EmailLogsTab } from "@/components/admin/email/EmailLogsTab";
import { EmailDisparoManualTab } from "@/components/admin/email/EmailDisparoManualTab";
import { EmailSuppressionsTab } from "@/components/admin/email/EmailSuppressionsTab";
import { CommunicationHeaderSelector } from "@/components/admin/whatsapp/CommunicationHeaderSelector";


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
  "monitor-grupos": "Monitor Grupos",
  aquecimento: "Aquecimento",
  grupos: "Grupos",
  "smart-links": "Smart Links",
  "email-templates": "Templates de Email",
  "email-fila": "Fila de Email",
  "email-disparo": "Disparo Manual de Email",
  "email-logs": "Logs de Email",
  "email-suppressions": "Emails Bloqueados",
};

export default function AdminWhatsApp() {
  const [activeTab, setActiveTab] = useState("instancias");
  const [showMetrics, setShowMetrics] = useState(false);

  return (
    <AdminLayout 
      pageTitle="Comunicação" 
      headerRightContent={
        <CommunicationHeaderSelector 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          showMetrics={showMetrics}
          onToggleMetrics={setShowMetrics}
        />
      }
    >

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0">
          {/* Content header (desktop only) */}
          <div className="hidden md:flex items-center gap-2 px-5 lg:px-6 pt-5 lg:pt-6 pb-1">
            <h2 className="text-lg font-semibold">{TAB_TITLES[activeTab] || activeTab}</h2>
          </div>

          <div className="p-4 md:px-5 md:pb-6 lg:px-6">
            <div className="max-w-5xl space-y-4">
              {activeTab === "instancias" && <InstanciasTab />}

              {activeTab === "proxies" && <ProxiesTab />}
              {activeTab === "templates" && <TemplatesTab />}
              {activeTab === "fila" && <FilaTab />}
              {activeTab === "mensagens" && <MensagensTab />}
              {activeTab === "disparo" && <DisparoManualTab />}
              {activeTab === "logs" && <LogsTab />}
              {activeTab === "retargeting" && <RetargetingPanelTab />}
              {activeTab === "disparo-grupo" && <DisparoGrupoTab />}
              {activeTab === "monitor-grupos" && <MonitorGruposTab />}
              {activeTab === "aquecimento" && <AquecimentoTab />}
              {activeTab === "grupos" && <GruposTab />}
              {activeTab === "smart-links" && <SmartLinksTab />}
              {activeTab === "email-templates" && <EmailTemplatesTab />}
              {activeTab === "email-fila" && <EmailFilaTab />}
              {activeTab === "email-disparo" && <EmailDisparoManualTab />}
              {activeTab === "email-logs" && <EmailLogsTab />}
              {activeTab === "email-suppressions" && <EmailSuppressionsTab />}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

