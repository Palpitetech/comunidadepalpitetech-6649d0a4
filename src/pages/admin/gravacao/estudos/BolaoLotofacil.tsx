import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import BolaoLotofacilShell from "@/components/gravacao/estudos/BolaoLotofacilShell";
import { Sparkles, TrendingUp, TrendingDown, Zap, Users, UserMinus, Crosshair, DollarSign, Target } from "lucide-react";

// ============================================================
// Hook: últimos 12 concursos da Lotofácil
// ============================================================
interface Concurso { concurso: number; dezenas: number[]; }

function useUltimos12Lotofacil() {
  return useQuery({
    queryKey: ["bolao-lotofacil-12"],
    queryFn: async (): Promise<Concurso[]> => {
      const { data, error } = await (supabase as any)
        .from("resultados_loterias")
        .select("concurso, dezenas")
        .eq("loteria", "lotofacil")
        .order("concurso", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data || []).map((r: any) => ({
        concurso: r.concurso,
        dezenas: (r.dezenas as number[]).slice().sort((a, b) => a - b),
      }));
    },
  });
}

// ============================================================
// Cálculos estatísticos sobre os 12 concursos
// ============================================================
function calcOcorrencias(concursos: Concurso[]) {
  const cont = new Array(26).fill(0);
  concursos.forEach((c) => c.dezenas.forEach((d) => cont[d]++));
  const rank = Array.from({ length: 25 }, (_, i) => ({ dezena: i + 1, qtd: cont[i + 1] }));
  return rank;
}

function calcSaltoTriplo(concursos: Concurso[]) {
  // Top dezenas com aparições em 3 sorteios consecutivos dentro da janela
  const ord = [...concursos].sort((a, b) => a.concurso - b.concurso); // mais antigo → mais novo
  const count: Record<number, number> = {};
  for (let d = 1; d <= 25; d++) count[d] = 0;
  for (let d = 1; d <= 25; d++) {
    let streak = 0;
    for (const c of ord) {
      if (c.dezenas.includes(d)) {
        streak++;
        if (streak >= 3) count[d]++;
      } else streak = 0;
    }
  }
  return Object.entries(count)
    .map(([k, v]) => ({ dezena: Number(k), qtd: v }))
    .sort((a, b) => b.qtd - a.qtd);
}

function calcDuplasJuntas(concursos: Concurso[]) {
  const map: Record<string, { a: number; b: number; qtd: number }> = {};
  for (let a = 1; a <= 25; a++) {
    for (let b = a + 1; b <= 25; b++) {
      const key = `${a}-${b}`;
      map[key] = { a, b, qtd: 0 };
    }
  }
  concursos.forEach((c) => {
    const d = c.dezenas;
    for (let i = 0; i < d.length; i++)
      for (let j = i + 1; j < d.length; j++) {
        const key = `${d[i]}-${d[j]}`;
        map[key].qtd++;
      }
  });
  return Object.values(map).sort((x, y) => y.qtd - x.qtd);
}

function calcDuplasAusentes(concursos: Concurso[]) {
  // Pares que nunca apareceram juntos (qtd ausente = total - juntos)
  const juntas = calcDuplasJuntas(concursos);
  const total = concursos.length;
  return juntas
    .map((p) => ({ ...p, ausente: total - p.qtd }))
    .sort((a, b) => b.ausente - a.ausente);
}

function calcTopPosicao(concursos: Concurso[], posicao: number, topN = 2) {
  const cont = new Array(26).fill(0);
  concursos.forEach((c) => {
    const d = c.dezenas[posicao - 1];
    if (d !== undefined) cont[d]++;
  });
  return Array.from({ length: 25 }, (_, i) => ({ dezena: i + 1, qtd: cont[i + 1] }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, topN);
}

// ============================================================
// Componentes de apoio
// ============================================================
const Bola = ({ n, size = 72, glow = true }: { n: number; size?: number; glow?: boolean }) => (
  <div
    className="rounded-full flex items-center justify-center font-black"
    style={{
      width: size,
      height: size,
      background: "linear-gradient(160deg, #DDD6FE 0%, #A78BFA 60%, #7C3AED 100%)",
      color: "#14082A",
      fontSize: size * 0.45,
      boxShadow: glow ? "0 0 24px rgba(167, 139, 250, 0.7), inset 0 -4px 10px rgba(0,0,0,0.2)" : "none",
      border: "2px solid rgba(255,255,255,0.4)",
      fontFeatureSettings: '"tnum"',
    }}
  >
    {String(n).padStart(2, "0")}
  </div>
);

const Pill = ({ children }: { children: React.ReactNode }) => (
  <span
    className="text-[11px] tracking-[0.4em] uppercase font-black px-4 py-1.5 rounded-full"
    style={{
      background: "rgba(167, 139, 250, 0.12)",
      color: "#DDD6FE",
      border: "1px solid rgba(167, 139, 250, 0.4)",
    }}
  >
    {children}
  </span>
);

const SlideTitle = ({ icon: Icon, kicker, title, children }: any) => (
  <div className="flex flex-col items-center justify-center gap-8 w-full h-full max-w-6xl mx-auto text-center">
    <Pill>{kicker}</Pill>
    <Icon className="h-12 w-12" style={{ color: "#A78BFA", filter: "drop-shadow(0 0 20px rgba(167,139,250,0.8))" }} />
    <h2
      className="text-6xl md:text-7xl font-black leading-[1.05] tracking-tight"
      style={{ color: "#F5F3FF", textShadow: "0 0 40px rgba(167,139,250,0.25)" }}
    >
      {title}
    </h2>
    {children}
  </div>
);

// ============================================================
// Slides estáticos (01 a 04)
// ============================================================
function Slide01() {
  return (
    <div className="flex flex-col items-center justify-center gap-10 w-full h-full text-center">
      <Pill>Bolão Palpite Tech · Lotofácil</Pill>
      <Sparkles className="h-16 w-16" style={{ color: "#DDD6FE", filter: "drop-shadow(0 0 30px rgba(167,139,250,0.9))" }} />
      <h1
        className="text-7xl md:text-9xl font-black leading-[0.92] tracking-tight max-w-6xl"
        style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#F5F3FF", textShadow: "0 0 40px rgba(167,139,250,0.25)" }}
      >
        Aumente suas chances<br />em até{" "}
        <span
          style={{
            background: "linear-gradient(135deg, #DDD6FE 0%, #A78BFA 50%, #7C3AED 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontStyle: "italic", textShadow: "0 0 60px rgba(167,139,250,0.6)",
          }}
        >96×</span>
      </h1>
      <p className="text-2xl md:text-3xl text-white/75 max-w-4xl">
        Na próxima <strong className="text-[#DDD6FE]">Lotofácil de final 0</strong>, com prêmio previsto em
      </p>
      <div
        className="rounded-2xl px-12 py-6 backdrop-blur-sm"
        style={{
          background: "rgba(20, 8, 42, 0.6)",
          border: "1.5px solid rgba(167, 139, 250, 0.5)",
          boxShadow: "0 0 60px rgba(167, 139, 250, 0.3), inset 0 0 30px rgba(167, 139, 250, 0.06)",
        }}
      >
        <p className="text-[11px] uppercase tracking-[0.55em] mb-2 font-bold" style={{ color: "rgba(221, 214, 254, 0.75)" }}>
          Prêmio previsto
        </p>
        <p className="text-6xl md:text-7xl font-black leading-none"
          style={{ color: "#DDD6FE", textShadow: "0 0 30px rgba(167,139,250,0.8)" }}>
          R$ 6 milhões
        </p>
      </div>
      <p className="text-xl text-white/60 tracking-wide">★ Cotas para Lotofácil ★</p>
    </div>
  );
}

function PrecoCard({ titulo, valor, qtd, destaque }: any) {
  return (
    <div
      className="rounded-2xl px-8 py-8 backdrop-blur-sm flex flex-col items-center gap-3 min-w-[280px]"
      style={{
        background: destaque
          ? "linear-gradient(160deg, rgba(124, 58, 237, 0.25) 0%, rgba(20, 8, 42, 0.9) 100%)"
          : "rgba(20, 8, 42, 0.65)",
        border: destaque ? "2px solid #A78BFA" : "1.5px solid rgba(167, 139, 250, 0.3)",
        boxShadow: destaque
          ? "0 0 50px rgba(167, 139, 250, 0.55), inset 0 0 30px rgba(167, 139, 250, 0.1)"
          : "0 0 20px rgba(167, 139, 250, 0.15)",
      }}
    >
      <p className="text-xs tracking-[0.4em] uppercase font-black" style={{ color: "#DDD6FE" }}>{titulo}</p>
      <p className="text-2xl text-white/70 font-bold">{qtd}</p>
      <p className="text-5xl md:text-6xl font-black"
        style={{ color: destaque ? "#DDD6FE" : "#F5F3FF", textShadow: "0 0 24px rgba(167,139,250,0.6)" }}>
        {valor}
      </p>
    </div>
  );
}

function Slide02() {
  return (
    <SlideTitle icon={DollarSign} kicker="Preços do Bolão" title="Compare e economize">
      <div className="flex flex-wrap items-stretch justify-center gap-6 mt-6">
        <PrecoCard titulo="Avulso" qtd="1 palpite · 16 dezenas" valor="R$ 56,00" />
        <PrecoCard titulo="Bolão A" qtd="3 palpites · 16 dezenas" valor="R$ 25,00" destaque />
        <PrecoCard titulo="Bolão B" qtd="6 palpites · 16 dezenas" valor="R$ 45,00" destaque />
      </div>
      <p className="text-xl text-white/70 mt-6 max-w-3xl">
        Pelo preço de <strong className="text-[#DDD6FE]">menos de 1 palpite avulso</strong>, você participa de até 6 jogos.
      </p>
    </SlideTitle>
  );
}

function Slide03() {
  return (
    <SlideTitle icon={TrendingUp} kicker="Multiplicador de chances" title="Sua chance multiplicada">
      <div className="flex flex-wrap items-stretch justify-center gap-8 mt-4">
        <div className="rounded-2xl px-10 py-8 text-center backdrop-blur-sm"
          style={{ background: "rgba(20, 8, 42, 0.65)", border: "1.5px solid rgba(167, 139, 250, 0.4)" }}>
          <p className="text-[11px] uppercase tracking-[0.4em] font-bold mb-3" style={{ color: "#DDD6FE" }}>Bolão B</p>
          <p className="text-7xl md:text-8xl font-black"
            style={{ background: "linear-gradient(135deg, #DDD6FE, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            96×
          </p>
          <p className="text-lg text-white/75 mt-3">6 palpites de 16 dezenas</p>
        </div>
        <div className="rounded-2xl px-10 py-8 text-center backdrop-blur-sm"
          style={{ background: "rgba(20, 8, 42, 0.65)", border: "1.5px solid rgba(167, 139, 250, 0.4)" }}>
          <p className="text-[11px] uppercase tracking-[0.4em] font-bold mb-3" style={{ color: "#DDD6FE" }}>Bolão A</p>
          <p className="text-7xl md:text-8xl font-black"
            style={{ background: "linear-gradient(135deg, #DDD6FE, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            48×
          </p>
          <p className="text-lg text-white/75 mt-3">3 palpites de 16 dezenas</p>
        </div>
      </div>
      <p className="text-xl text-white/70 mt-6 max-w-3xl">
        Mais palpites, mais combinações, mais chances de levar.
      </p>
    </SlideTitle>
  );
}

function Slide04() {
  return (
    <SlideTitle icon={Sparkles} kicker="Combo Total" title="Participe dos dois e tenha 144×">
      <div className="rounded-2xl px-10 py-8 backdrop-blur-sm max-w-4xl mt-4"
        style={{
          background: "linear-gradient(160deg, rgba(124, 58, 237, 0.25) 0%, rgba(20, 8, 42, 0.9) 100%)",
          border: "2px solid #A78BFA",
          boxShadow: "0 0 50px rgba(167, 139, 250, 0.55)",
        }}>
        <p className="text-8xl md:text-9xl font-black text-center"
          style={{
            background: "linear-gradient(135deg, #DDD6FE 0%, #A78BFA 50%, #7C3AED 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontStyle: "italic",
            textShadow: "0 0 60px rgba(167,139,250,0.6)",
          }}>
          144×
        </p>
        <p className="text-2xl text-center text-white/85 mt-4">
          <strong>9 palpites</strong> de 16 dezenas
        </p>
      </div>
      <p className="text-xl md:text-2xl text-white/75 max-w-3xl text-center mt-6">
        Pelo valor de <strong className="text-[#DDD6FE]">nem mesmo 2 palpites avulsos</strong>
        <br />
        <span className="text-3xl font-black text-[#DDD6FE]">R$ 70,00</span>{" "}
        <span className="text-white/55">vs R$ 116,00 avulso</span>
      </p>
    </SlideTitle>
  );
}

// ============================================================
// Slides com dados (05 a 10)
// ============================================================
function SlideDezenasList({ items, label }: { items: { dezena: number; qtd: number }[]; label: string }) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-6 mt-2">
      {items.map((d, i) => (
        <div key={d.dezena} className="flex flex-col items-center gap-3"
          style={{ animation: `fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s both` }}>
          <Bola n={d.dezena} size={i === 0 ? 110 : 95} />
          <span className="font-mono text-2xl font-black"
            style={{ color: "#DDD6FE", textShadow: "0 0 12px rgba(167,139,250,0.7)" }}>
            {d.qtd}× {label}
          </span>
        </div>
      ))}
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

function Slide05({ rank }: { rank: { dezena: number; qtd: number }[] }) {
  const top5 = rank.slice(0, 5);
  return (
    <SlideTitle icon={TrendingUp} kicker="Top 5 · Últimos 12 concursos" title="Dezenas com MAIS ocorrências">
      <SlideDezenasList items={top5} label="vezes" />
    </SlideTitle>
  );
}

function Slide06({ rank }: { rank: { dezena: number; qtd: number }[] }) {
  const bottom5 = [...rank].sort((a, b) => a.qtd - b.qtd).slice(0, 5);
  return (
    <SlideTitle icon={TrendingDown} kicker="Top 5 · Últimos 12 concursos" title="Dezenas com MENOS ocorrências">
      <SlideDezenasList items={bottom5} label="vezes" />
    </SlideTitle>
  );
}

function Slide07({ salto }: { salto: { dezena: number; qtd: number }[] }) {
  const top = salto.filter((s) => s.qtd > 0).slice(0, 5);
  return (
    <SlideTitle icon={Zap} kicker="Padrão de Tendência" title="Comportamento de Salto Triplo">
      <p className="text-lg text-white/65 max-w-3xl -mt-2">
        Dezenas que apareceram em <strong className="text-[#DDD6FE]">3 sorteios consecutivos</strong> dentro dos últimos 12.
      </p>
      {top.length === 0 ? (
        <p className="text-white/50 text-xl mt-6">Nenhum salto triplo detectado na janela atual.</p>
      ) : (
        <SlideDezenasList items={top} label="salto(s)" />
      )}
    </SlideTitle>
  );
}

function SlideDuplasList({ duplas, valor, label }: any) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-10 mt-2">
      {duplas.map((d: any, i: number) => (
        <div key={`${d.a}-${d.b}`} className="flex flex-col items-center gap-3"
          style={{ animation: `fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s both` }}>
          <div className="flex items-center gap-3">
            <Bola n={d.a} size={100} />
            <span className="text-4xl font-black text-[#A78BFA]">+</span>
            <Bola n={d.b} size={100} />
          </div>
          <span className="font-mono text-2xl font-black"
            style={{ color: "#DDD6FE", textShadow: "0 0 12px rgba(167,139,250,0.7)" }}>
            {valor(d)}× {label}
          </span>
        </div>
      ))}
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

function Slide08({ duplas }: { duplas: { a: number; b: number; qtd: number }[] }) {
  return (
    <SlideTitle icon={Users} kicker="Duplas Juntas · 12 concursos" title="Top 3 duplas mais PRESENTES juntas">
      <SlideDuplasList duplas={duplas.slice(0, 3)} valor={(d: any) => d.qtd} label="juntas" />
    </SlideTitle>
  );
}

function Slide09({ ausentes }: { ausentes: { a: number; b: number; ausente: number }[] }) {
  return (
    <SlideTitle icon={UserMinus} kicker="Duplas Ausentes · 12 concursos" title="Top 3 duplas mais AUSENTES juntas">
      <SlideDuplasList duplas={ausentes.slice(0, 3)} valor={(d: any) => d.ausente} label="ausentes" />
    </SlideTitle>
  );
}

function PosicaoBloco({ posicao, top }: { posicao: number; top: { dezena: number; qtd: number }[] }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl px-8 py-6 backdrop-blur-sm"
      style={{ background: "rgba(20, 8, 42, 0.65)", border: "1.5px solid rgba(167, 139, 250, 0.35)" }}>
      <p className="text-xs tracking-[0.4em] uppercase font-black" style={{ color: "#DDD6FE" }}>
        Posição {String(posicao).padStart(2, "0")}
      </p>
      <div className="flex items-end gap-4">
        {top.map((d, i) => (
          <div key={d.dezena} className="flex flex-col items-center gap-2">
            <Bola n={d.dezena} size={i === 0 ? 90 : 78} />
            <span className="font-mono text-lg font-black" style={{ color: "#DDD6FE" }}>{d.qtd}×</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide10({ p1, p2, p14, p15 }: any) {
  return (
    <SlideTitle icon={Crosshair} kicker="Top 2 por Posição · 12 concursos" title="Posições 01 · 02 · 14 · 15">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
        <PosicaoBloco posicao={1} top={p1} />
        <PosicaoBloco posicao={2} top={p2} />
        <PosicaoBloco posicao={14} top={p14} />
        <PosicaoBloco posicao={15} top={p15} />
      </div>
      <p className="text-base text-white/55 mt-4 tracking-wider">
        Estudo baseado nos últimos 12 concursos da Lotofácil
      </p>
    </SlideTitle>
  );
}

// ============================================================
// Página principal
// ============================================================
export default function BolaoLotofacil() {
  const { data: concursos, isLoading, isError } = useUltimos12Lotofacil();

  const stats = useMemo(() => {
    if (!concursos || concursos.length === 0) return null;
    const ocorrencias = calcOcorrencias(concursos);
    const salto = calcSaltoTriplo(concursos);
    const duplasJuntas = calcDuplasJuntas(concursos);
    const duplasAusentes = calcDuplasAusentes(concursos);
    return {
      ocorrencias,
      salto,
      duplasJuntas,
      duplasAusentes,
      p1: calcTopPosicao(concursos, 1),
      p2: calcTopPosicao(concursos, 2),
      p14: calcTopPosicao(concursos, 14),
      p15: calcTopPosicao(concursos, 15),
    };
  }, [concursos]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#14082A" }}>
        <div className="w-12 h-12 rounded-full border-4 border-[#A78BFA]/30 border-t-[#A78BFA] animate-spin" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#14082A" }}>
        <p className="text-white/70 text-lg">Erro ao carregar os últimos 12 concursos da Lotofácil.</p>
      </div>
    );
  }

  return (
    <BolaoLotofacilShell>
      <Slide01 />
      <Slide02 />
      <Slide03 />
      <Slide04 />
      <Slide05 rank={stats.ocorrencias.slice().sort((a, b) => b.qtd - a.qtd)} />
      <Slide06 rank={stats.ocorrencias} />
      <Slide07 salto={stats.salto} />
      <Slide08 duplas={stats.duplasJuntas} />
      <Slide09 ausentes={stats.duplasAusentes} />
      <Slide10 p1={stats.p1} p2={stats.p2} p24={stats.p24} p25={stats.p25} />
    </BolaoLotofacilShell>
  );
}
