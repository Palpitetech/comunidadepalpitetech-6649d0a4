import { useState, useMemo, useEffect, useRef } from "react";
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
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const LOTERIAS = [
  { value: "megasena", label: "Mega-Sena", sigla: "MS", max: 60 },
  { value: "lotofacil", label: "Lotofácil", sigla: "LF", max: 25 },
  { value: "duplasena", label: "Dupla Sena", sigla: "DS", max: 50 },
  { value: "quina", label: "Quina", sigla: "QN", max: 80 },
  { value: "lotomania", label: "Lotomania", sigla: "LM", max: 99, min: 0 },
];

function parsePalpitesTexto(texto: string): string[][] {
  const linhas = texto.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  return linhas.map((linha) =>
    linha.split(/[-,\s]+/).map((n) => n.trim()).filter((n) => /^\d+$/.test(n)).map((n) => n.padStart(2, "0"))
  );
}

export default function NovoBolao() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mesAno = useMemo(() => {
    const n = new Date();
    return String(n.getMonth() + 1).padStart(2, "0") + String(n.getFullYear());
  }, []);

  const mesAnoLabel = useMemo(() => {
    const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const n = new Date();
    return `${meses[n.getMonth()]} / ${n.getFullYear()}`;
  }, []);

  const [loteria, setLoteria] = useState("");
  const [concursoNumero, setConcursoNumero] = useState("");
  const [dataConcurso, setDataConcurso] = useState("");
  const [totalPalpites, setTotalPalpites] = useState(0);
  const [dezenasPorPalpite, setDezenasPorPalpite] = useState(15);
  const [totalCotas, setTotalCotas] = useState(0);
  const [valorCota, setValorCota] = useState("");
  const [valorPremiacao, setValorPremiacao] = useState("");
  const [descricaoEstrategia, setDescricaoEstrategia] = useState("");
  const [palpitesBruto, setPalpitesBruto] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [loadingConcurso, setLoadingConcurso] = useState(false);
  const [autoPreenchido, setAutoPreenchido] = useState(false);
  const [semDados, setSemDados] = useState(false);

  useEffect(() => {
    setAutoPreenchido(false);
    setSemDados(false);
  }, [loteria]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(Math.max(el.scrollHeight, 200), 500) + "px";
    }
  }, [palpitesBruto]);

  const handleLoteriaSelecionada = async (valor: string) => {
    setLoteria(valor);
    setLoadingConcurso(true);
    setAutoPreenchido(false);
    setSemDados(false);

    try {
      const { data } = await supabase
        .from("proximos_concursos")
        .select("*")
        .eq("loteria", valor)
        .maybeSingle();

      if (data && data.numero_concurso && data.numero_concurso !== "0") {
        setConcursoNumero(data.numero_concurso);
        setDataConcurso(data.data_sorteio ?? "");
        setValorPremiacao(data.premio_estimado?.toString() ?? "");
        setAutoPreenchido(true);
      } else {
        setConcursoNumero("");
        setDataConcurso("");
        setValorPremiacao("");
        setSemDados(true);
      }
    } catch (err) {
      console.error("[NovoBolao] Erro ao buscar concurso:", err);
    } finally {
      setLoadingConcurso(false);
    }
  };

  const loteriaInfo = LOTERIAS.find((l) => l.value === loteria);
  const sigla = loteriaInfo?.sigla || "XX";
  const minNum = loteriaInfo?.min ?? 1;
  const maxNum = loteriaInfo?.max ?? 60;
  const loteriaLabel = loteriaInfo?.label ?? loteria;

  const codigoPreview = useMemo(() => {
    if (!sigla || sigla === "XX" || !mesAno) return "—";
    return `${sigla}-XXXX-${mesAno}`;
  }, [sigla, mesAno]);

  const count = totalPalpites || 0;

  // Real-time line analysis
  const linhasAnalisadas = useMemo(() => {
    const parsed = parsePalpitesTexto(palpitesBruto);
    return parsed.map((dezenas, i) => {
      const issues: { type: "error" | "warning"; msg: string }[] = [];
      const countDez = dezenas.length;

      if (countDez !== dezenasPorPalpite) {
        const diff = dezenasPorPalpite - countDez;
        issues.push({
          type: "error",
          msg: `${countDez} dezena(s)${diff > 0 ? ` (faltam ${diff})` : ` (excede em ${-diff})`}`,
        });
      }

      const seen = new Set<string>();
      dezenas.forEach((d) => {
        const n = parseInt(d, 10);
        if (isNaN(n) || n < minNum || n > maxNum) {
          issues.push({ type: "warning", msg: `número ${d} inválido para ${loteriaLabel} (${String(minNum).padStart(2, "0")}-${String(maxNum).padStart(2, "0")})` });
        }
        if (seen.has(d)) {
          issues.push({ type: "error", msg: `número ${d} repetido` });
        }
        seen.add(d);
      });

      const ok = issues.length === 0 && countDez === dezenasPorPalpite;
      return { dezenas, count: countDez, ok, issues };
    });
  }, [palpitesBruto, dezenasPorPalpite, minNum, maxNum, loteriaLabel]);

  const completosCount = linhasAnalisadas.filter((l) => l.ok).length;
  const totalLinhas = linhasAnalisadas.length;

  function validate(): string[] {
    const errs: string[] = [];

    if (!loteria || !concursoNumero || !dataConcurso || !totalPalpites || !totalCotas || !valorCota) {
      errs.push("Preencha todos os campos obrigatórios.");
    }

    if (totalLinhas !== count) {
      errs.push(`Você informou ${totalLinhas} palpite(s) mas o bolão requer ${count}.`);
    }

    linhasAnalisadas.forEach((linha, i) => {
      if (linha.count !== dezenasPorPalpite) {
        errs.push(`Linha ${i + 1}: ${linha.count} dezena(s). Necessário: ${dezenasPorPalpite}.`);
      }
      const seen = new Set<string>();
      linha.dezenas.forEach((d) => {
        const n = parseInt(d, 10);
        if (isNaN(n) || n < minNum || n > maxNum) {
          errs.push(`Linha ${i + 1}: número "${d}" inválido para ${loteriaLabel}.`);
        }
        if (seen.has(d)) {
          errs.push(`Linha ${i + 1}: número ${d} repetido.`);
        }
        seen.add(d);
      });
    });

    return errs;
  }

  const handleSave = async (publish: boolean) => {
    setErrors([]);

    if (publish) {
      const errs = validate();
      if (errs.length > 0) {
        setErrors(errs);
        toast({ title: "Corrija os erros antes de publicar", variant: "destructive" });
        return;
      }
    } else {
      // Rascunho: apenas campos básicos do bolão, sem validar palpites
      if (!loteria || !concursoNumero || !dataConcurso || !totalCotas || !valorCota) {
        toast({ title: "Preencha os campos obrigatórios (loteria, concurso, data, cotas e valor)", variant: "destructive" });
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

      const palpitesArray = linhasAnalisadas.map((l) =>
        l.dezenas.map((d) => parseInt(d, 10)).filter((n) => !isNaN(n))
      );

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
              <Select value={loteria} onValueChange={handleLoteriaSelecionada}>
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
              <div className="relative">
                <Input value={concursoNumero} onChange={(e) => setConcursoNumero(e.target.value)} placeholder="3635" disabled={loadingConcurso} />
                {loadingConcurso && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Data do Concurso *</Label>
              <div className="relative">
                <Input type="date" value={dataConcurso} onChange={(e) => setDataConcurso(e.target.value)} disabled={loadingConcurso} />
                {loadingConcurso && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
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
              <div className="relative">
                <Input type="number" step="0.01" min={0} value={valorPremiacao} onChange={(e) => setValorPremiacao(e.target.value)} placeholder="0.00" disabled={loadingConcurso} />
                {loadingConcurso && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>

            {/* Hints de auto-preenchimento */}
            {autoPreenchido && (
              <div className="rounded-md border border-[hsl(var(--chart-2))] bg-[hsl(var(--chart-2)/0.1)] p-3 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--chart-2))] mt-0.5 shrink-0" />
                <div className="text-xs text-[hsl(var(--chart-2))]">
                  <p className="font-medium">Dados preenchidos automaticamente com base no próximo concurso.</p>
                  <p>Edite se necessário.</p>
                </div>
              </div>
            )}
            {semDados && (
              <div className="rounded-md border border-yellow-500 bg-yellow-500/10 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-xs text-yellow-700">
                  <p className="font-medium">Nenhum concurso cadastrado para esta loteria.</p>
                  <p>
                    Atualize em{" "}
                    <a href="/admin/concursos" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                      Admin → Próximos Concursos
                    </a>
                  </p>
                </div>
              </div>
            )}

            {/* 11. Estratégia */}
            <div className="space-y-1.5">
              <Label>Descrição da Estratégia</Label>
              <Textarea value={descricaoEstrategia} onChange={(e) => setDescricaoEstrategia(e.target.value)} rows={3} />
            </div>

            {/* 12. Palpites — textarea único */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Palpites do Bolão</Label>
                {count > 0 && totalLinhas > 0 && (
                  <span className="text-xs font-medium flex items-center gap-1">
                    {completosCount === count && totalLinhas === count ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--chart-2))]" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className={totalLinhas === count && completosCount === count ? "text-[hsl(var(--chart-2))]" : totalLinhas !== count ? "text-destructive" : "text-muted-foreground"}>
                      Palpites: {totalLinhas} / {count}
                    </span>
                  </span>
                )}
              </div>

              <textarea
                ref={textareaRef}
                value={palpitesBruto}
                onChange={(e) => setPalpitesBruto(e.target.value)}
                placeholder={`Cole um palpite por linha.\nEx:\n01-02-03-04-05-06-07-08-09-10-11-12-13-14-15\n02-03-04-05-06-07-08-09-10-11-12-13-14-15-16`}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono text-xs"
                style={{ minHeight: 200, maxHeight: 500, resize: "none", overflow: "auto" }}
              />
              <p className="text-xs text-muted-foreground">
                Cole um palpite por linha. Separe os números por hífen (-), vírgula (,) ou espaço.
              </p>

              {/* Feedback em tempo real */}
              {totalLinhas > 0 && (
                <div className="rounded-md border bg-muted/50 p-3 space-y-1.5 max-h-[250px] overflow-y-auto">
                  {linhasAnalisadas.map((linha, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      {linha.ok ? (
                        <>
                          <span className="text-[hsl(var(--chart-2))] shrink-0">✅</span>
                          <span className="text-[hsl(var(--chart-2))]">
                            Linha {i + 1}: {linha.count} dezenas
                          </span>
                        </>
                      ) : (
                        <>
                          {linha.issues.some((x) => x.type === "warning") && !linha.issues.some((x) => x.type === "error") ? (
                            <span className="text-yellow-600 shrink-0">⚠️</span>
                          ) : (
                            <span className="text-destructive shrink-0">❌</span>
                          )}
                          <div>
                            <span className={linha.issues.some((x) => x.type === "error") ? "text-destructive" : "text-yellow-600"}>
                              Linha {i + 1}: {linha.count}/{dezenasPorPalpite} dezenas
                            </span>
                            {linha.issues.map((issue, j) => (
                              <span key={j} className={`block ml-3 ${issue.type === "warning" ? "text-yellow-600" : "text-destructive"}`}>
                                — {issue.msg}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {totalLinhas === 0 && palpitesBruto.trim() === "" && count > 0 && (
                <p className="text-xs text-muted-foreground">Cole seus palpites acima.</p>
              )}
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
