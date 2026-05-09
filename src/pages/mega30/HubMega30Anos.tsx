import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ESTUDOS_MEGA_30 } from "@/lib/mega30/estudosCatalog";
import { Lock } from "lucide-react";

export default function HubMega30Anos() {
  const navigate = useNavigate();
  return (
    <MainLayout pageTitle="Mega 30 Anos" hideBackButton>
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-1">15 Estudos Especiais</h2>
          <p className="text-sm text-muted-foreground">
            Análises técnicas baseadas em 30 anos de história da Mega-Sena.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {ESTUDOS_MEGA_30.map((e) => {
            const Icon = e.icon;
            const disabled = !e.disponivel;
            return (
              <button
                key={e.id}
                disabled={disabled}
                onClick={() => !disabled && navigate(`/mega-30/estudo/${e.id}`)}
                className="block group text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div
                  className="flex flex-col p-4 rounded-2xl border bg-card hover:shadow-lg transition-all h-full relative"
                  style={{ borderBottomWidth: 4, borderBottomColor: "hsl(45, 65%, 52%)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "hsl(125, 70%, 20% / 0.12)", color: "hsl(125, 70%, 25%)" }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "hsl(45, 65%, 35%)" }}
                    >
                      Estudo {e.numero.toString().padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground leading-snug mb-1">
                    {e.titulo}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{e.subtitulo}</p>
                  {disabled && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-muted-foreground bg-background/90 rounded px-1.5 py-0.5">
                      <Lock className="h-3 w-3" /> Em breve
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
