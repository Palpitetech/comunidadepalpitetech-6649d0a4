import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const LOTERIAS = [
  { value: "megasena", label: "Mega-Sena", sigla: "MS", max: 60 },
  { value: "lotofacil", label: "Lotofácil", sigla: "LF", max: 25 },
  { value: "duplasena", label: "Dupla Sena", sigla: "DS", max: 50 },
  { value: "quina", label: "Quina", sigla: "QN", max: 80 },
  { value: "lotomania", label: "Lotomania", sigla: "LM", max: 99, min: 0 },
];

function parseDezenas(text: string): string[] {
  return text.split(/[,\s]+/).filter((d) => d.trim().length > 0);
}

export default function NovoBolao() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const mesAnoDefault = String(now.getMonth() + 1).padStart(2, "0") + String(now.getFullYear());

  const [loteria, setLoteria] = useState("");
  const [mesAno, setMesAno] = useState(mesAnoDefault);
  const [concursoNumero, setConcursoNumero] = useState("");
  const [dataConcurso, setDataConcurso] = useState("");
  const [totalPalpites, setTotalPalpites] = useState(0);
  const [dezenasPorPalpite, setDezenasPorPalpite] = useState(15);
  const [totalCotas, setTotalCotas] = useState(0);
  const [valorCota, setValorCota] = useState("");
  const [valorPremiacao, setValorPremiacao] = useState("");
  const [descricaoEstrategia, setDescricaoEstrategia] = useState("");
  const [palpitesTexto, setPalpitesTexto] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [emptyIndices, setEmptyIndices] = useState<Set<number>>(new Set());

  const loteriaInfo = LOTERIAS.find((l) => l.value === loteria);
  const sigla = loteriaInfo?.sigla || "XX";

  const codigoPreview = useMemo(() => {
    if (!sigla || sigla === "XX" || !mesAno) return "—";
    return `${sigla}-XXXX-${mesAno}`;
  }, [sigla, mesAno]);

  // Sync palpites array with totalPalpites
  const count = totalPalpites || 0;
  if (palpitesTexto.length !== count) {
    const next = Array.from({ length: count }, (_, i) => palpitesTexto[i] || "");
    setPalpitesTexto(next);
    setEmptyIndices(new Set());
    setErrors([]);
  }

  const palpiteStats = useMemo(() => {
    return palpitesTexto.map((txt) => {
      const dezenas = parseDezenas(txt);
      return { count: dezenas.length, complete: dezenas.length === dezenasPorPalpite && dezenas.length > 0 };
    });
  }, [palpitesTexto, dezenasPorPalpite]);

  const completosCount = palpiteStats.filter((s) => s.complete).length;

  function validate(): string[] {
    const errs: string[] = [];
    const empty = new Set<number>();

    if (!loteria || !concursoNumero || !dataConcurso || !totalPalpites || !totalCotas || !valorCota) {
      errs.push("Preencha todos os campos obrigatórios.");
    }

    // V1: quantidade preenchidos
    const preenchidos = palpitesTexto.filter((p) => p.trim().length > 0).length;
    if (preenchidos !== count) {
      errs.push(`Você informou ${preenchidos} palpite(s) mas o bolão requer ${count}.`);
      palpitesTexto.forEach((p, i) => { if (!p.trim()) empty.add(i); });
    }

    const minNum = loteriaInfo?.min ?? 1;
    const maxNum = loteriaInfo?.max ?? 60;
    const loteriaLabel = loteriaInfo?.label ?? loteria;

    palpitesTexto.forEach((txt, i) => {
      if (!txt.trim()) return;
      const dezenas = parseDezenas(txt);

      // V2: count
      if (dezenas.length !== dezenasPorPalpite) {
        errs.push(`Palpite ${i + 1} tem ${dezenas.length} dezena(s). Necessário: ${dezenasPorPalpite}.`);
      }

      // V3: valid numbers
      const seen = new Set<number>();
      dezenas.forEach((d) => {
        const n = parseInt(d, 10);
        if (isNaN(n) || n < minNum || n > maxNum) {
          errs.push(`Palpite ${i + 1}: número "${d}" inválido para ${loteriaLabel}.`);
        }
        // V4: duplicates
        if (seen.has(n)) {
          errs.push(`Palpite ${i + 1}: número ${String(n).padStart(2, "0")} aparece mais de uma vez.`);
        }
        seen.add(n);
      });
    });

    setEmptyIndices(empty);
    return errs;
  }

  const handleSave = async (publish: boolean) => {
    setErrors([]);
    setEmptyIndices(new Set());

    if (publish) {
      const errs = validate();
      if (errs.length > 0) {
        setErrors(errs);
        toast({ title: "Corrija os erros antes de publicar", variant: "destructive" });
        return;
      }
    } else {
      // Rascunho: only basic fields
      if (!loteria || !concursoNumero || !dataConcurso || !totalPalpites || !totalCotas || !valorCota) {
        toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
        return;
      }
    }

    setSaving(true);
    try {
      const { data: codeData, error: codeErr } = await supabase.rpc("generate_bolao_codigo", {
        p_sigla: sigla,
        p_mes_ano: mesAno,
      });
      if (codeErr) throw codeErr;

      const codigo = codeData as string;
      const nextNum = parseInt(codigo.split("-")[1], 10);

      const palpitesArray = palpitesTexto
        .filter((t) => t.trim())
        .map((t) => parseDezenas(t).map((d) => parseInt(d, 10)).filter((n) => !isNaN(n)));

      const { data: bolao, error } = await supabase
        .from("boloes")
        .insert({
          codigo,
          loteria,
          sigla,
          numero_bolao: nextNum,
          mes_ano: mesAno,
          concurso_numero: concursoNumero,
          data_concurso: dataConcurso,
          total_palpites: totalPalpites,
          dezenas_por_palpite: dezenasPorPalpite,
          total_cotas: totalCotas,
          valor_cota: parseFloat(valorCota),
          valor_premiacao: valorPremiacao ? parseFloat(valorPremiacao) : 0,
          descricao_estrategia: descricaoEstrategia || null,
          palpites: palpitesArray,
          status: publish ? "ativo" : "rascunho",
        })
        .select("id")
        .single();

      if (error) throw error;

      const cotas = Array.from({ length: totalCotas }, (_, i) => ({
        bolao_id: bolao.id,
        numero_cota: i + 1,
        status: "disponivel",
      }));

      const { error: cotasErr } = await supabase.from("bolao_cotas").insert(cotas);
      if (cotasErr) throw cotasErr;

      toast({ title: `Bolão ${codigo} ${publish ? "publicado" : "salvo como rascunho"}!` });
      navigate("/admin/listagem-bolao");
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  function borderClass(i: number) {
    if (emptyIndices.has(i)) return "border-destructive";
    const txt = palpitesTexto[i];
    if (!txt || !txt.trim()) return "";
    const c = parseDezenas(txt).length;
    if (c === dezenasPorPalpite) return "border-[hsl(var(--chart-2))]";
    return "border-destructive";
  }

  function hintColor(i: number) {
    const txt = palpitesTexto[i];
    if (!txt || !txt.trim()) return "text-muted-foreground";
    const c = parseDezenas(txt).length;
    if (c === dezenasPorPalpite) return "text-[hsl(var(--chart-2))]";
    return "text-destructive";
  }

  return (
    <MainLayout pageTitle="Novo Bolão">
      <div className="px-4 py-3 md:container-senior md:py-8 max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Novo Bolão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 1. Loteria */}
            <div className="space-y-1.5">
              <Label>Loteria *</Label>
              <Select value={loteria} onValueChange={setLoteria}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {LOTERIAS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label} ({l.sigla})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Mês/Ano */}
            <div className="space-y-1.5">
              <Label>Mês/Ano *</Label>
              <Input value={mesAno} onChange={(e) => setMesAno(e.target.value)} placeholder="032026" />
            </div>

            {/* 3. Código */}
            <div className="space-y-1.5">
              <Label>Código (auto)</Label>
              <Input value={codigoPreview} readOnly className="bg-muted" />
            </div>

            {/* 4-5 */}
            <div className="space-y-1.5">
              <Label>Número do Concurso *</Label>
              <Input value={concursoNumero} onChange={(e) => setConcursoNumero(e.target.value)} placeholder="3635" />
            </div>
            <div className="space-y-1.5">
              <Label>Data do Concurso *</Label>
              <Input type="date" value={dataConcurso} onChange={(e) => setDataConcurso(e.target.value)} />
            </div>

            {/* 6-7 */}
            <div className="space-y-1.5">
              <Label>Qtd de Palpites *</Label>
              <Input type="number" min={1} value={totalPalpites || ""} onChange={(e) => setTotalPalpites(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Dezenas por Palpite *</Label>
              <Input type="number" min={1} value={dezenasPorPalpite} onChange={(e) => setDezenasPorPalpite(parseInt(e.target.value) || 0)} />
            </div>

            {/* 8-10 */}
            <div className="space-y-1.5">
              <Label>Quantidade de Cotas *</Label>
              <Input type="number" min={1} value={totalCotas || ""} onChange={(e) => setTotalCotas(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor por Cota (R$) *</Label>
              <Input type="number" step="0.01" min={0} value={valorCota} onChange={(e) => setValorCota(e.target.value)} placeholder="25.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Valor de Premiação (R$)</Label>
              <Input type="number" step="0.01" min={0} value={valorPremiacao} onChange={(e) => setValorPremiacao(e.target.value)} placeholder="0.00" />
            </div>

            {/* 11. Estratégia */}
            <div className="space-y-1.5">
              <Label>Descrição da Estratégia</Label>
              <Textarea value={descricaoEstrategia} onChange={(e) => setDescricaoEstrategia(e.target.value)} rows={3} />
            </div>

            {/* 12. Palpites */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Palpites do Bolão</Label>
                {count > 0 && (
                  <span className="text-xs font-medium flex items-center gap-1">
                    {completosCount === count ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--chart-2))]" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className={completosCount === count ? "text-[hsl(var(--chart-2))]" : "text-muted-foreground"}>
                      {completosCount}/{count} palpites completos
                    </span>
                  </span>
                )}
              </div>

              {count === 0 && (
                <p className="text-xs text-muted-foreground">Defina a quantidade de palpites acima.</p>
              )}

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {Array.from({ length: count }).map((_, i) => {
                  const c = palpiteStats[i]?.count ?? 0;
                  return (
                    <div key={i} className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Palpite {i + 1}</span>
                      <Textarea
                        value={palpitesTexto[i] || ""}
                        onChange={(e) => {
                          const next = [...palpitesTexto];
                          next[i] = e.target.value;
                          setPalpitesTexto(next);
                        }}
                        placeholder="Ex: 01, 02, 03, 04, 05, 06"
                        className={`font-mono text-xs min-h-[48px] ${borderClass(i)}`}
                        rows={2}
                      />
                      <span className={`text-xs ${hintColor(i)}`}>
                        {c} / {dezenasPorPalpite} dezenas
                        {c === dezenasPorPalpite && c > 0 && " ✅"}
                        {c > 0 && c !== dezenasPorPalpite && " ❌"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="rounded-md border border-destructive bg-destructive/10 p-3 space-y-1">
                {errors.map((e, i) => (
                  <p key={i} className="text-xs text-destructive">• {e}</p>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => handleSave(false)} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Salvar Rascunho
              </Button>
              <Button className="flex-1" onClick={() => handleSave(true)} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Publicar Bolão
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
