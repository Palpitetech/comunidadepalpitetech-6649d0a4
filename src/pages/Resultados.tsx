import { MainLayout } from "@/components/layout/MainLayout";
import { BarChart3 } from "lucide-react";

export default function Resultados() {
  return (
    <MainLayout>
      <div className="container-senior py-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-senior-2xl font-bold">Resultados Completos</h1>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-senior-lg text-muted-foreground">
            Em breve você poderá consultar todo o histórico de resultados da Lotofácil.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
