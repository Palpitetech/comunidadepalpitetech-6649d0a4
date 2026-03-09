import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConviteCard } from "@/components/convites/ConviteCard";
import { ConvidadosList } from "@/components/convites/ConvidadosList";
import { MilestoneProgress } from "@/components/convites/MilestoneProgress";
import { useConvites } from "@/hooks/useConvites";

const Convites: React.FC = () => {
  const {
    referralCode,
    convidados,
    totalConvidados,
    totalVendas,
    progressCadastros,
    progressVendas,
    totalDaysEarned,
    isLoading,
    isGenerating,
    generateCode,
  } = useConvites();

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader title="Convites" />

        <p className="text-muted-foreground text-sm -mt-2">
          Convide amigos e ganhe assinatura grátis!
        </p>

        <ConviteCard
          referralCode={referralCode}
          isGenerating={isGenerating}
          onGenerateCode={generateCode}
        />

        <MilestoneProgress
          totalConvidados={totalConvidados}
          totalVendas={totalVendas}
          progressCadastros={progressCadastros}
          progressVendas={progressVendas}
          totalDaysEarned={totalDaysEarned}
        />

        <ConvidadosList
          convidados={convidados}
          totalConvidados={totalConvidados}
          isLoading={isLoading}
        />
      </div>
    </MainLayout>
  );
};

export default Convites;
