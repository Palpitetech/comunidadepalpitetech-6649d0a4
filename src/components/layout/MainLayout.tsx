import { ReactNode, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopHeader } from "./DesktopHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { PageHeader } from "./PageHeader";

interface MainLayoutProps {
  children: ReactNode;
  /** Título da página - quando fornecido, renderiza o PageHeader no mobile automaticamente */
  pageTitle?: string;
  /** Callback customizado para o botão voltar */
  onBack?: () => void;
}

export function MainLayout({ children, pageTitle, onBack }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop: Header completo / Mobile: PageHeader se pageTitle fornecido */}
      {!isMobile && <DesktopHeader />}
      {isMobile && pageTitle && <PageHeader title={pageTitle} onBack={onBack} />}

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
      {isMobile && (
        <>
          <MobileBottomNav onMenuClick={() => setMenuOpen(true)} />
          <MobileMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
        </>
      )}
    </div>
  );
}
