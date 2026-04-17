import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  headerRightContent?: ReactNode;
}

export function AdminLayout({ children, pageTitle, headerRightContent }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header 
            className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4"
            style={{ 
              paddingTop: 'env(safe-area-inset-top, 0px)',
              height: 'calc(3.5rem + env(safe-area-inset-top, 0px))' 
            }}
          >
            <SidebarTrigger className="h-8 w-8" />
            {pageTitle && (
              <h1 className="text-lg font-semibold truncate flex-1">{pageTitle}</h1>
            )}
            {headerRightContent && <div className="ml-auto">{headerRightContent}</div>}
          </header>

          {/* Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
