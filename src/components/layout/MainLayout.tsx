import { ReactNode, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopHeader } from "./DesktopHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { PageHeader } from "./PageHeader";
import { PushNotificationBanner } from "@/components/pwa/PushNotificationBanner";
import { RequireCelularModal } from "@/components/shared/RequireCelularModal";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen flex flex-col bg-slate-50/50" style={{ paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : undefined }}>
      {/* Desktop: Header completo / Mobile: PageHeader se pageTitle fornecido */}
      {!isMobile && <DesktopHeader />}
      {isMobile && pageTitle !== undefined && (
        <PageHeader 
          title={pageTitle} 
          breadcrumb={breadcrumb}
          onBack={onBack} 
          rightContent={headerRightContent}
          hideBackButton={hideBackButton}
        />
      )}

      {/* Push Notification Banner */}
      <PushNotificationBanner />

      {/* Require celular modal */}
      <RequireCelularModal />

      {/* Main Content */}
      <main className={`flex-1 ${isMobile ? 'pb-20' : ''}`}>
        {children}
      </main>

      {/* Footer / Rodapé */}
      <footer className={cn(
        "border-t border-slate-100 bg-white/50 py-8",
        isMobile ? "mb-20 px-6" : "px-4"
      )}>
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            <strong>Aviso legal:</strong> Este site não possui vínculo com a Caixa Econômica Federal ou Meta. O conteúdo é educacional/informativo e não garante premiação. Aposte com responsabilidade.
          </p>
          <p className="text-[11px] text-slate-400 font-bold tracking-tight">
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
