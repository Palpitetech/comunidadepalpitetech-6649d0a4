import { Users } from "lucide-react";

// Feature flag para controlar criação de posts por usuários
// Mudar para true quando quiser reativar
const PERMITIR_POSTS_USUARIOS = false;

export function FeedHeader() {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {/* Title removed, moved to Header via MainLayout */}
      </div>
      
      {/* Botão de criar post desativado temporariamente
          Para reativar: mudar PERMITIR_POSTS_USUARIOS para true */}
      {PERMITIR_POSTS_USUARIOS && (
        <button className="hidden">
          {/* Código preservado para reativação futura */}
        </button>
      )}
    </div>
  );
}
