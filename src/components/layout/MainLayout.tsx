import { ReactNode, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { AppHeader } from "./AppHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMenuSheet } from "./MobileMenuSheet";

import { RequireCelularModal } from "@/components/shared/RequireCelularModal";
import { MegaEspecialBanner } from "@/components/shared/MegaEspecialBanner";
import { PageVideo } from "@/components/shared/PageVideo";
import { PushNotificationBanner } from "@/components/pwa/PushNotificationBanner";
import { DownloadBanner } from "@/components/pwa/DownloadBanner";
import { PWAUpdateBanner } from "@/components/pwa/PWAUpdateBanner";

interface MainLayoutProps {
  children: ReactNode;
  /** Título da página - quando fornecido, exibido centralizado no header mobile */
  pageTitle?: string;
  /** Callback customizado para o botão voltar */
  onBack?: () => void;
  /** Esconde o botão de voltar no header mobile */
  hideBackButton?: boolean;
  /** Esconde a barra de navegação inferior no mobile */
  hideBottomNav?: boolean;
  /** ID do vídeo do YouTube para exibir no início da página */
  youtubeVideoId?: string;
}

export function MainLayout({
  children,
  pageTitle,
  onBack,
  hideBackButton,
  hideBottomNav,
  youtubeVideoId
}: MainLayoutProps) {
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Força esconder o menu inferior na página raiz quando deslogado
  const finalHideBottomNav = hideBottomNav || (location.pathname === "/" && !isAuthenticated);

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : undefined }}>
      {/* Banner promocional global */}
      <MegaEspecialBanner />

      {/* Header unificado mobile + desktop */}
      <AppHeader
        pageTitle={pageTitle}
        onBack={onBack}
        hideBackButton={hideBackButton}
      />

      {/* Require celular modal */}
      <RequireCelularModal />

      {/* Main Content */}
      <main className={`flex-1 ${isMobile && !finalHideBottomNav ? 'pb-20' : ''}`}>
        <PushNotificationBanner />
        <DownloadBanner />
        <PWAUpdateBanner />
        {youtubeVideoId && (
          <div className="cluster-container mt-4">
            <PageVideo videoId={youtubeVideoId} />
          </div>
        )}
        {children}
      </main>

      {/* Footer / Rodapé */}
      <footer className={`border-t border-border bg-card py-4 ${isMobile && !finalHideBottomNav ? 'mb-16' : ''}`}>
        <div className="max-w-3xl mx-auto px-4 text-center space-y-1.5">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <strong>Aviso legal:</strong> Este site não possui qualquer vínculo com a Caixa Econômica Federal, Facebook, Instagram, Meta ou qualquer outra empresa do grupo Meta Platforms, Inc. O conteúdo apresentado tem caráter exclusivamente educacional e informativo, baseado em análises estatísticas de resultados públicos. <strong>Não garantimos premiação em nenhuma modalidade de loteria.</strong> Aposte com responsabilidade.
          </p>
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} Palpite Tech. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Mobile Navigation */}
      {isMobile && !finalHideBottomNav && (
        <>
          <MobileBottomNav onMenuClick={() => setMenuOpen(true)} />
          <MobileMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
        </>
      )}
    </div>
  );
}
