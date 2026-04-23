import { Helmet } from "react-helmet";
import { Play } from "lucide-react";

const LINKS = {
  youtube: "https://www.youtube.com/@palpitetech",
  geradorInteligente: "/planos",
  palpitesLotofacil: "#",
  palpitesMega: "#",
  estudosMega: "/login",
  estudosLotofacil: "/login",
};

const ROXO = "270 60% 50%";
const VERDE = "125 70% 40%";

type CardProps = {
  href: string;
  external?: boolean;
  cor: string; // HSL string
  titulo: string;
  subtitulo: string;
  destaque: string;
  badgeFree?: boolean;
};

function OfferCard({ href, external, cor, titulo, subtitulo, destaque, badgeFree }: CardProps) {
  const isPrimary = cor === "primary";
  const borderStyle = isPrimary
    ? { borderLeftColor: "hsl(var(--primary))" }
    : { borderLeftColor: `hsl(${cor})` };
  const bgStyle = isPrimary
    ? { backgroundColor: "hsl(var(--primary) / 0.05)" }
    : { backgroundColor: `hsl(${cor} / 0.05)` };
  const textColor = isPrimary ? "hsl(var(--primary))" : `hsl(${cor})`;

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="block w-full p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all bg-white border-l-4"
      style={{ ...borderStyle, ...bgStyle }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black leading-tight text-slate-900">
            {titulo}
          </h2>
          <p className="text-base font-semibold text-slate-700 mt-1">
            {subtitulo}
          </p>
          <p
            className="text-sm font-bold mt-2"
            style={{ color: textColor }}
          >
            {destaque}
          </p>
        </div>
        {badgeFree && (
          <span
            className="text-[10px] font-black px-2 py-1 rounded-full text-white whitespace-nowrap"
            style={{ backgroundColor: textColor }}
          >
            GRÁTIS
          </span>
        )}
      </div>
    </a>
  );
}

export default function PalpitesEstudos() {
  return (
    <>
      <Helmet>
        <title>Palpite Tech · Links</title>
        <meta name="robots" content="noindex" />
        <meta name="description" content="Links oficiais Palpite Tech — palpites, estudos e gerador inteligente." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Banner YouTube — 100% largura */}
        <a
          href={LINKS.youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-gradient-to-r from-red-600 to-red-700 hover:brightness-110 transition-all shadow-[0_20px_40px_-10px_rgba(220,38,38,0.45)]"
        >
          <div className="flex items-center justify-center gap-3 py-4 px-4">
            <Play className="h-6 w-6 text-white fill-white" />
            <span className="text-white font-bold text-base sm:text-lg text-center">
              Vídeos novos todos os Dias no YouTube
            </span>
          </div>
        </a>

        {/* Logo + handle */}
        <div className="w-[80%] max-w-md mx-auto pt-10 pb-6 text-center">
          <img
            src="/logo-palpite-tech.png"
            alt="Palpite Tech"
            className="h-20 mx-auto object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            @palpitetech
          </p>
        </div>

        {/* Cards */}
        <div className="w-[80%] max-w-md mx-auto space-y-4 pb-10">
          <OfferCard
            href={LINKS.geradorInteligente}
            cor="primary"
            titulo="Gere palpites Exclusivos"
            subtitulo="com nosso gerador inteligente"
            destaque="A partir de R$ 30,44/mês"
          />

          <OfferCard
            href={LINKS.palpitesLotofacil}
            external
            cor={ROXO}
            titulo="Receba 15 palpites quentes"
            subtitulo="para Lotofácil"
            destaque="Apenas R$ 19,00 · pagamento único"
          />

          <OfferCard
            href={LINKS.palpitesMega}
            external
            cor={VERDE}
            titulo="Receba 15 palpites quentes"
            subtitulo="para Mega-Sena"
            destaque="Apenas R$ 19,00 · pagamento único"
          />

          <OfferCard
            href={LINKS.estudosMega}
            cor={VERDE}
            titulo="Estudos diários"
            subtitulo="Mega-Sena"
            destaque="100% de graça"
            badgeFree
          />

          <OfferCard
            href={LINKS.estudosLotofacil}
            cor={ROXO}
            titulo="Estudos diários"
            subtitulo="Lotofácil"
            destaque="100% de graça"
            badgeFree
          />
        </div>

        {/* Footer minimalista */}
        <footer className="w-[80%] max-w-md mx-auto pb-8 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Palpite Tech
          </p>
        </footer>
      </div>
    </>
  );
}
