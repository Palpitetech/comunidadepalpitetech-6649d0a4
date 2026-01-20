import { MainLayout } from "@/components/layout/MainLayout";
import { TrendingUp } from "lucide-react";

export default function Tendencias() {
  return (
    <MainLayout>
      <div className="container-senior py-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-senior-2xl font-bold">Tendências</h1>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-senior-lg text-muted-foreground">
            Análise de Pares/Ímpares, Primos e Moldura em breve.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
