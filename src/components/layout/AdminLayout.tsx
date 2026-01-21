import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileMenuSheet } from "./MobileMenuSheet";
import { UserCog, FileText, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: "/admin", label: "Painel", icon: UserCog },
    { to: "/admin/planos", label: "Planos", icon: FileText },
    { to: "/admin/usuarios", label: "Usuários", icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#1E3A5F]">
      {/* Desktop: Header Admin */}
      {!isMobile && (
        <header className="sticky top-0 z-40 border-b border-white/20 bg-[#162D4A]">
          <div className="container-senior flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Voltar ao site</span>
              </Link>
              <div className="h-6 w-px bg-white/20" />
              <span className="text-xl font-bold text-white">Painel Admin</span>
            </div>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link key={item.to} to={item.to}>
                    <Button
                      variant="ghost"
                      className={`gap-2 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
      )}

      {/* Mobile: Header simples */}
      {isMobile && (
        <header className="sticky top-0 z-40 border-b border-white/20 bg-[#162D4A] px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-white/70">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="text-lg font-bold text-white">Admin</span>
            <div className="w-5" /> {/* Spacer */}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 ${isMobile ? "pb-20" : ""}`}>
        {children}
      </main>

      {/* Footer - apenas desktop */}
      {!isMobile && (
        <footer className="border-t border-white/20 bg-[#162D4A] py-6">
          <div className="container-senior text-center text-white/60">
            <p className="text-senior-sm">
              Painel Administrativo - Palpite Tech © 2026
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
