import { MainLayout } from "@/components/layout/MainLayout";
import { Flame } from "lucide-react";

export default function Frequencia() {
  return (
    <MainLayout>
      <div className="container-senior py-8">
        <div className="flex items-center gap-3 mb-6">
          <Flame className="h-8 w-8 text-primary" />
          <h1 className="text-senior-2xl font-bold">Dezenas Quentes e Frias</h1>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-senior-lg text-muted-foreground">
            Análise de frequência das dezenas em breve.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
