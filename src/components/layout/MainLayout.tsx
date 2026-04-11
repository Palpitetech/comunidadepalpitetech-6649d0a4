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
      <main className={`flex-1 ${isMobile ? 'pb-16' : ''}`}>
        {children}
      </main>

      {/* Footer / Rodapé */}
      <footer className={`border-t border-border/40 bg-card py-4 ${isMobile ? 'mb-14' : ''}`}>
        <div className="max-w-2xl mx-auto px-6 text-center space-y-1.5">
          <p className="text-[9px] text-muted-foreground/60 leading-relaxed uppercase tracking-tight">
            Este site tem caráter exclusivamente educacional e informativo. <strong>Não garantimos premiação.</strong> Aposte com responsabilidade.
          </p>
          <p className="text-[9px] text-muted-foreground/40 font-medium">
            © {new Date().getFullYear()} Palpite Tech.
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
