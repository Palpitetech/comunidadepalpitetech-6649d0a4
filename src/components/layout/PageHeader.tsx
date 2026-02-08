import { ArrowLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

export function PageHeader({ title, breadcrumb, onBack, rightContent, hideBackButton }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback para a página inicial se não houver histórico
      navigate("/comunidade");
    }
  };

  // Se há breadcrumb, o título é o último item e os anteriores são clicáveis
  const hasBreadcrumb = breadcrumb && breadcrumb.length > 0;

  return (
    <header className="sticky top-0 z-20 bg-background border-b border-border px-4 py-3">
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
          
          {hasBreadcrumb ? (
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
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
              <h1 className="text-lg font-bold text-foreground truncate">
                {title}
              </h1>
            </div>
          ) : (
            <h1 className="text-lg font-bold text-foreground truncate">
              {title}
            </h1>
          )}
        </div>
        
        {rightContent && (
          <div className="shrink-0">
            {rightContent}
          </div>
        )}
      </div>
    </header>
  );
}
