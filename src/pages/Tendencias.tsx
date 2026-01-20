import { MainLayout } from "@/components/layout/MainLayout";
import { TrendingUp } from "lucide-react";
import { TabelaParesImpares } from "@/components/tendencias/TabelaParesImpares";
import { TabelaMoldura } from "@/components/tendencias/TabelaMoldura";
import { TabelaPrimos } from "@/components/tendencias/TabelaPrimos";

export default function Tendencias() {
  return (
    <MainLayout>
      <div className="container-senior py-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold">Tendências</h1>
        </div>

        {/* Tabela de Pares/Ímpares */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Combinações de Pares e Ímpares
          </h2>
          <TabelaParesImpares />
        </section>

        {/* Tabela de Moldura */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🖼️</span>
            Combinações de Moldura e Miolo
          </h2>
          <TabelaMoldura />
        </section>

        {/* Tabela de Primos */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-2xl">🔢</span>
            Combinações de Primos e Não Primos
          </h2>
          <TabelaPrimos />
        </section>
      </div>
    </MainLayout>
  );
}
