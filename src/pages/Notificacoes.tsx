import { useIsMobile } from "@/hooks/use-mobile";
import { MainLayout } from "@/components/layout/MainLayout";
import { Bell } from "lucide-react";

export default function Notificacoes() {
  const isMobile = useIsMobile();
  return (
    <MainLayout pageTitle="Notificações">
      <div className="container-senior py-8">
        {!isMobile && (
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-8 w-8 text-primary" />
            <h1 className="text-senior-2xl font-bold">Notificações</h1>
          </div>
        )}
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-senior-lg text-muted-foreground">
            Você ainda não tem notificações.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
