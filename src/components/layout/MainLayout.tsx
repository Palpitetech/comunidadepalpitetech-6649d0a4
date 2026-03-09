import { ReactNode, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopHeader } from "./DesktopHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { PageHeader } from "./PageHeader";
import { PushNotificationBanner } from "@/components/pwa/PushNotificationBanner";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { PageHeader } from "./PageHeader";

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
      {/* Desktop: Header completo / Mobile: PageHeader se pageTitle fornecido */}
      {!isMobile && <DesktopHeader />}
      {isMobile && pageTitle && (
        <PageHeader 
          title={pageTitle} 
          breadcrumb={breadcrumb}
          onBack={onBack} 
          rightContent={headerRightContent}
          hideBackButton={hideBackButton}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 ${isMobile ? 'pb-20' : ''}`}>
        {children}
      </main>

      {/* Footer - apenas desktop */}
      {!isMobile && (
        <footer className="border-t border-border bg-card py-6">
          <div className="container-senior text-center text-muted-foreground">
            <p className="text-senior-sm">
              © 2026 Palpite Tech. Todos os direitos reservados.
            </p>
            <p className="text-sm mt-2">
              Este site não possui vínculo com a Caixa Econômica Federal.
            </p>
          </div>
        </footer>
      )}

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
