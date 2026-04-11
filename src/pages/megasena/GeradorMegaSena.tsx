import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { QuantidadeSelector } from "@/components/gerador/QuantidadeSelector";
import { PeriodoAnaliseSelector } from "@/components/gerador/PeriodoAnaliseSelector";
import { PedidoEspecialInput } from "@/components/gerador/PedidoEspecialInput";
import { FiltroDezenaSelectorMegaSena } from "@/components/megasena/FiltroDezenaSelectorMegaSena";
import { ResultadosSheetMegaSena } from "@/components/megasena/ResultadosSheetMegaSena";
import { useGeradorMegaSena } from "@/hooks/useGeradorMegaSena";
import { useGeradorStatus } from "@/hooks/useGeradorStatus";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useUpsell } from "@/contexts/UpsellContext";
import { Dices, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
// UpgradeModal removido pois é gerenciado globalmente pelo UpsellProvider
// ... existing code
  const [ultimoConcursoDezenas, setUltimoConcursoDezenas] = useState<number[]>([]);
  // upgradeOpen removido pois o modal é global
  const { openUpgradeModal } = useUpsell();
// ... existing code
        {/* O UpgradeModal agora é gerenciado globalmente pelo UpsellProvider */}
      </div>
    </MainLayout>
  );
}
