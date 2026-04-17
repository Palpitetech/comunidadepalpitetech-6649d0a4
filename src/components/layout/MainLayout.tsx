import { ReactNode, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopHeader } from "./DesktopHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { PageHeader } from "./PageHeader";
import { PushNotificationBanner } from "@/components/pwa/PushNotificationBanner";
import { RequireCelularModal } from "@/components/shared/RequireCelularModal";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface MainLayoutProps {
  children: ReactNode;
  /** Título da página - quando fornecido, renderiza o PageHeader no mobile automaticamente */
  pageTitle?: string;
  /** Breadcrumb trail antes do título */
  breadcrumb?: BreadcrumbItem[];
  /** Callback customizado para o botão voltar */
  onBack?: () => void;
  /** Conteúdo à direita do header (mobile) */
  headerRightContent?: ReactNode;
  /** Esconde o botão de voltar no header mobile */
  hideBackButton?: boolean;
  /** Esconde a barra de navegação inferior no mobile */
  hideBottomNav?: boolean;
}

export function MainLayout({ children, pageTitle, breadcrumb, onBack, headerRightContent, hideBackButton, hideBottomNav }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : undefined }}>
      {/* Header completo - em todos os tamanhos, DesktopHeader cuida das visibilidades mobile/desktop */}
      <DesktopHeader 
        pageTitle={pageTitle} 
        breadcrumb={breadcrumb} 
        onBack={onBack}
        hideBackButton={hideBackButton}
      />
      
      {isMobile && pageTitle !== undefined && (
        <PageHeader 
          title="" 
          breadcrumb={breadcrumb}
          onBack={onBack} 
          rightContent={headerRightContent}
          hideBackButton={true}
        />
      )}

      {/* Push Notification Banner */}
      <PushNotificationBanner />

      {/* Require celular modal */}
      <RequireCelularModal />

      {/* Main Content */}
      <main className={`flex-1 ${isMobile && !hideBottomNav ? 'pb-20' : ''}`}>
        {children}
      </main>

      {/* Footer / Rodapé */}
      <footer className={`border-t border-border bg-card py-4 ${isMobile && !hideBottomNav ? 'mb-16' : ''}`}>
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
      {isMobile && !hideBottomNav && (
        <>
          <MobileBottomNav onMenuClick={() => setMenuOpen(true)} />
          <MobileMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
        </>
      )}
    </div>
  );
}
