/**
 * AdminLayout - Layout principal da área administrativa.
 * Gerencia a alternância entre Sidebar (Desktop) e BottomBar/Drawer (Mobile).
 * Breakpoint de transição: md (768px).
 */
import { ReactNode, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminMobileBottomBar } from "./AdminMobileBottomBar";
import { AdminMobileDrawer } from "./AdminMobileDrawer";
import { useMobileNav } from "@/hooks/useMobileNav";
import { cn } from "@/lib/utils";
import { adminNavConfig } from "@/config/adminNavConfig";
import { toast } from "sonner";

const REQUIRED_SECTIONS: { id: string; label: string }[] = [
  { id: "gravacao-mega-especial", label: "Gravação Mega Especial" },
];

function runAdminNavSelfTest() {
  const missing = REQUIRED_SECTIONS.filter(
    (req) => !adminNavConfig.some((s) => s.id === req.id && (s.items?.length ?? 0) > 0)
  );
  if (missing.length > 0) {
    const labels = missing.map((m) => m.label).join(", ");
    console.error("[AdminNav SelfTest] Seção(ões) ausente(s) na árvore do menu:", labels);
    toast.error("Menu Admin incompleto", {
      description: `Seção ausente: ${labels}. Verifique adminNavConfig.ts.`,
      duration: 8000,
    });
    return false;
  }
  console.info("[AdminNav SelfTest] OK — todas as seções obrigatórias presentes.");
  return true;
}


interface AdminLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  headerRightContent?: ReactNode;
}

export function AdminLayout({ children, pageTitle, headerRightContent }: AdminLayoutProps) {
  const { isDrawerOpen, closeDrawer, drawerView, setDrawerView } = useMobileNav();

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <AdminSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header 
            className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4 flex-none"
            style={{ 
              paddingTop: 'env(safe-area-inset-top, 0px)',
              minHeight: 'calc(3.5rem + env(safe-area-inset-top, 0px))',
              height: 'auto'
            }}
          >

            <div className="flex items-center gap-2 overflow-hidden flex-1">
              {pageTitle && (
                <h1 className="text-sm md:text-lg font-semibold truncate">
                  {pageTitle}
                </h1>
              )}
              {headerRightContent && (
                <div className="flex-1 overflow-hidden">
                  {headerRightContent}
                </div>
              )}
            </div>
          </header>


          {/* Content */}
          <main className={cn("flex-1 overflow-auto pb-20 md:pb-0 landscape:pb-16")}>
            {children}
          </main>

        </div>

        {/* Mobile Components */}
        <div className="md:hidden">
          <AdminMobileBottomBar />
          <AdminMobileDrawer 
            isOpen={isDrawerOpen} 
            onClose={closeDrawer} 
            view={drawerView}
            onViewChange={setDrawerView}
          />
        </div>
      </div>
    </SidebarProvider>
  );
}

