import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConviteCard } from "@/components/convites/ConviteCard";
import { ConvidadosList } from "@/components/convites/ConvidadosList";
import { useConvites } from "@/hooks/useConvites";
import { Gift } from "lucide-react";

const Convites: React.FC = () => {
  const {
    referralCode,
    convidados,
    totalConvidados,
    isLoading,
    isGenerating,
    generateCode,
  } = useConvites();

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          title="Convites"
          subtitle="Convide amigos e acompanhe quem entrou pela sua indicação"
          icon={Gift}
        />

        <ConviteCard
          referralCode={referralCode}
          isGenerating={isGenerating}
          onGenerateCode={generateCode}
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
