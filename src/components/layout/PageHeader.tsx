import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  /** Breadcrumb trail antes do título: ["Meus Palpites", "Sem Pasta"] */
  breadcrumb?: BreadcrumbItem[];
  onBack?: () => void;
  /** Ações à direita do header */
  rightContent?: ReactNode;
  /** Esconde o botão de voltar (ex: página inicial) */
  hideBackButton?: boolean;
}

// Mapeamento de rotas para navegação de retorno
const getParentRoute = (pathname: string): string => {
  // Rotas da Mega Sena
  if (pathname.startsWith("/megasena/")) {
    return "/megasena/resultados";
  }
  // Rotas de ferramentas da Lotofácil
  if (["/desdobramento", "/fechamento", "/gerador", "/tendencias", "/frequencia"].includes(pathname)) {
    return "/resultados";
  }
  // Fallback padrão
  return "/comunidade";
};

export function PageHeader({ title, breadcrumb, onBack, rightContent, hideBackButton }: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 2) {
      // Só usa navigate(-1) se houver histórico real (> 2 para evitar problemas)
      navigate(-1);
    } else {
      // Navega para a rota pai baseada no contexto atual
      navigate(getParentRoute(location.pathname));
    }
  };

  const hasBreadcrumb = !!(breadcrumb && breadcrumb.length > 0);

  // Se não há título, nem breadcrumb, nem botão de voltar e nem conteúdo à direita, não renderiza nada
  if (!title && !hasBreadcrumb && hideBackButton && !rightContent) {
    return null;
  }

  return (
    <header 
      className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40 px-4 py-2.5"
      style={{ paddingTop: `max(0.6rem, env(safe-area-inset-top, 0.6rem))` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {!hideBackButton && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          
          {/* When title is empty but rightContent exists, render it inline */}
          {!title && rightContent ? (
            <div className="min-w-0 flex-1">
              {rightContent}
            </div>
          ) : hasBreadcrumb ? (
            <div className="hidden md:flex items-center gap-1 min-w-0 overflow-hidden">
              {breadcrumb.map((item, index) => (
                <div key={index} className="flex items-center gap-1 min-w-0">
                  {item.onClick ? (
                    <button
                      onClick={item.onClick}
                      className="text-muted-foreground hover:text-foreground transition-colors text-lg font-medium truncate"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="text-muted-foreground text-lg font-medium truncate">
                      {item.label}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              ))}
              <h1 className="hidden md:block text-lg font-bold text-foreground truncate">
                {title}
              </h1>
            </div>
          ) : title ? (
            <h1 className="hidden md:block text-lg font-bold text-foreground truncate">
              {title}
            </h1>
          ) : null}
        </div>
        
        {title && rightContent && (
          <div className="shrink-0">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
}
