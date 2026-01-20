import { ReactNode } from "react";
import { Header } from "./Header";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
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
    </div>
  );
}
