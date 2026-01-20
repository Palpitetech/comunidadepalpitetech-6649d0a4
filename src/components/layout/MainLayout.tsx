import { ReactNode, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopHeader } from "./DesktopHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { Link } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop: Header completo / Mobile: Header mínimo */}
      {isMobile ? (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex items-center justify-center py-3">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <span className="text-2xl">🍀</span>
              <span className="text-senior-lg font-bold text-primary">Palpite Tech</span>
            </Link>
          </div>
        </header>
      ) : (
        <DesktopHeader />
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
      {isMobile && (
        <>
          <MobileBottomNav onMenuClick={() => setMenuOpen(true)} />
          <MobileMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
        </>
      )}
    </div>
  );
}
