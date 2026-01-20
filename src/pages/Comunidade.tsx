import { MainLayout } from "@/components/layout/MainLayout";
import { Users } from "lucide-react";

export default function Comunidade() {
  return (
    <MainLayout>
      <div className="container-senior py-8">
        <div className="flex items-center gap-3 mb-6">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-senior-2xl font-bold">Comunidade</h1>
        </div>
        
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-senior-lg text-muted-foreground">
            Em breve você poderá compartilhar seus palpites e ver os palpites da comunidade.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
