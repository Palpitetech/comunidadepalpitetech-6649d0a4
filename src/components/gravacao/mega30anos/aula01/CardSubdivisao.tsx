import DezenaBolaMega from "../DezenaBolaMega";

interface Item {
  dezena: number;
  freq: number;
}

interface Props {
  titulo: string;
  subtitulo?: string;
  itens: Item[];
  /** Tamanho das bolas */
  size?: "sm" | "md" | "lg";
}

/**
 * Card padrão de uma subdivisão (linha/coluna/quadrante/mini).
 * Tipografia grande para público 50+, alto contraste.
 */
export default function CardSubdivisao({ titulo, subtitulo, itens, size = "md" }: Props) {
  return (
    <div
      className="rounded-2xl px-4 py-3 flex flex-col items-center"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,40,24,0.92) 0%, rgba(6,28,16,0.92) 100%)",
        border: "2px solid rgba(212,175,55,0.7)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
      }}
    >
      <div
        className="font-extrabold tracking-wide uppercase text-center leading-tight"
        style={{
          color: "#F5E6B3",
          fontFamily: "'Cinzel', serif",
          fontSize: size === "lg" ? 26 : size === "md" ? 22 : 18,
          textShadow: "0 1px 3px rgba(0,0,0,0.6)",
        }}
      >
        {titulo}
      </div>
      {subtitulo && (
        <div
          className="text-center mb-2"
          style={{ color: "rgba(245,230,179,0.7)", fontSize: 14 }}
        >
          {subtitulo}
        </div>
      )}
      <div className={`flex flex-wrap justify-center ${size === "lg" ? "gap-3 mt-2" : "gap-2 mt-2"}`}>
        {itens.map((it) => (
          <DezenaBolaMega key={it.dezena} numero={it.dezena} size={size} freq={it.freq} />
        ))}
      </div>
    </div>
  );
}
