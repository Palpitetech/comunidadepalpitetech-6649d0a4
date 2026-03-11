import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Smartphone, FileText, Send, ScrollText, Flame } from "lucide-react";
import { InstanciasTab } from "@/components/admin/whatsapp/InstanciasTab";
import { TemplatesTab } from "@/components/admin/whatsapp/TemplatesTab";
import { FilaTab } from "@/components/admin/whatsapp/FilaTab";
import { LogsTab } from "@/components/admin/whatsapp/LogsTab";
import { AquecimentoTab } from "@/components/admin/whatsapp/AquecimentoTab";

const tabs = [
  { value: "instancias", label: "Instâncias", icon: Smartphone },
  { value: "templates", label: "Templates", icon: FileText },
  { value: "fila", label: "Fila", icon: Send },
  { value: "logs", label: "Logs", icon: ScrollText },
  { value: "aquecimento", label: "Aquecimento", icon: Flame },
] as const;

export default function AdminWhatsApp() {
  const [activeTab, setActiveTab] = useState("instancias");

  return (
    <MainLayout>
      <div className="container-senior py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Gerencie instâncias, templates e envios</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-5">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
                <tab.icon className="h-4 w-4 hidden sm:inline" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="instancias" className="mt-6">
            <InstanciasTab />
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <TemplatesTab />
          </TabsContent>

          <TabsContent value="fila" className="mt-6">
            <FilaTab />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <LogsTab />
          </TabsContent>

          <TabsContent value="aquecimento" className="mt-6">
            <AquecimentoTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
