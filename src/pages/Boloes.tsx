import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { type BolaoPublico } from "@/lib/boloes";
import { BolaoDetailSheet } from "@/components/boloes/BolaoDetailSheet";
import { BolaoCard } from "@/components/boloes/BolaoCard";
import { useUserRole } from "@/hooks/useUserRole";
import { Trophy, Wrench } from "lucide-react";

export default function Boloes() {
  const [selectedBolao, setSelectedBolao] = useState<BolaoPublico | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { isAdmin } = useUserRole();

  const { data: boloes, isLoading } = useQuery({
    queryKey: ["boloes-publicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boloes")
        .select("id, codigo, loteria, sigla, concurso_numero, data_concurso, total_cotas, cotas_vendidas, valor_cota, valor_premiacao, descricao_estrategia, palpites, pdf_url, status, resultado_verificado, palpites_premiados")
        .in("status", ["ativo", "encerrado", "premiado"])
        .order("data_concurso", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as BolaoPublico[];
    },
    enabled: isAdmin,
  });

  // Non-admin users see "Em desenvolvimento"
  if (!isAdmin) {
    return (
      <MainLayout pageTitle="Bolões">
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Wrench className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">Em desenvolvimento</h2>
          <p className="text-base text-muted-foreground max-w-sm">
            Os Bolões estão sendo preparados com muito carinho. Em breve você poderá participar!
          </p>
        </div>
      </MainLayout>
    );
  }

  const handleOpen = (bolao: BolaoPublico) => {
    setSelectedBolao(bolao);
    setSheetOpen(true);
  };

  return (
    <MainLayout pageTitle="Bolões">
      <div className="px-4 py-3 md:container-senior md:py-8 space-y-3 md:space-y-6">
        {isLoading ? (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : !boloes?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🎰</span>
            <h2 className="text-lg font-bold mb-1">Nenhum bolão disponível no momento.</h2>
            <p className="text-sm text-muted-foreground">Novos bolões em breve!</p>
          </div>
        ) : (
          <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
            {boloes.map((b) => (
              <BolaoCard key={b.id} bolao={b} onOpen={handleOpen} />
            ))}
          </div>
        )}
      </div>

      <BolaoDetailSheet
        bolao={selectedBolao}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </MainLayout>
  );
}
