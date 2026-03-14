import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const LOTERIAS = [
  { value: "megasena", label: "Mega-Sena", sigla: "MS" },
  { value: "lotofacil", label: "Lotofácil", sigla: "LF" },
  { value: "duplasena", label: "Dupla Sena", sigla: "DS" },
  { value: "quina", label: "Quina", sigla: "QN" },
  { value: "lotomania", label: "Lotomania", sigla: "LM" },
];

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
  const [modoColar, setModoColar] = useState(false);
  const [palpitesTexto, setPalpitesTexto] = useState("");
  const [palpitesManuais, setPalpitesManuais] = useState<string[][]>([]);

  const sigla = LOTERIAS.find((l) => l.value === loteria)?.sigla || "XX";

  const codigoPreview = useMemo(() => {
    if (!sigla || sigla === "XX" || !mesAno) return "—";
    return `${sigla}-XXXX-${mesAno}`;
  }, [sigla, mesAno]);

  // Keep manual arrays in sync with totalPalpites
  const palpitesCount = totalPalpites || 0;
  if (palpitesManuais.length !== palpitesCount) {
    const next = Array.from({ length: palpitesCount }, (_, i) => palpitesManuais[i] || []);
    setPalpitesManuais(next);
  }

  const parsePalpitesFromText = (text: string): number[][] => {
    return text
      .split("\n")
      .filter((l) => l.trim())
      .map((line) =>
        line
          .split(/[,;\s]+/)
          .map((n) => parseInt(n.trim(), 10))
          .filter((n) => !isNaN(n))
      )
      .filter((arr) => arr.length > 0);
  };

  const handleSave = async (publish: boolean) => {
    if (!loteria || !concursoNumero || !dataConcurso || !totalPalpites || !totalCotas || !valorCota) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Generate code
      const { data: codeData, error: codeErr } = await supabase.rpc("generate_bolao_codigo", {
        p_sigla: sigla,
        p_mes_ano: mesAno,
      });
      if (codeErr) throw codeErr;

      const codigo = codeData as string;
      const nextNum = parseInt(codigo.split("-")[1], 10);

      const palpitesArray = modoColar
        ? parsePalpitesFromText(palpitesTexto)
        : palpitesManuais.map((p) => p.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n)));

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

      // Create cotas
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

            {/* 4. Concurso */}
            <div className="space-y-1.5">
              <Label>Número do Concurso *</Label>
              <Input value={concursoNumero} onChange={(e) => setConcursoNumero(e.target.value)} placeholder="3635" />
            </div>

            {/* 5. Data Concurso */}
            <div className="space-y-1.5">
              <Label>Data do Concurso *</Label>
              <Input type="date" value={dataConcurso} onChange={(e) => setDataConcurso(e.target.value)} />
            </div>

            {/* 6. Qtd Palpites */}
            <div className="space-y-1.5">
              <Label>Qtd de Palpites *</Label>
              <Input type="number" min={1} value={totalPalpites || ""} onChange={(e) => setTotalPalpites(parseInt(e.target.value) || 0)} />
            </div>

            {/* 7. Dezenas por Palpite */}
            <div className="space-y-1.5">
              <Label>Dezenas por Palpite *</Label>
              <Input type="number" min={1} value={dezenasPorPalpite} onChange={(e) => setDezenasPorPalpite(parseInt(e.target.value) || 0)} />
            </div>

            {/* 8. Cotas */}
            <div className="space-y-1.5">
              <Label>Quantidade de Cotas *</Label>
              <Input type="number" min={1} value={totalCotas || ""} onChange={(e) => setTotalCotas(parseInt(e.target.value) || 0)} />
            </div>

            {/* 9. Valor Cota */}
            <div className="space-y-1.5">
              <Label>Valor por Cota (R$) *</Label>
              <Input type="number" step="0.01" min={0} value={valorCota} onChange={(e) => setValorCota(e.target.value)} placeholder="25.00" />
            </div>

            {/* 10. Premiação */}
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Palpites do Bolão</Label>
                <div className="flex items-center gap-2 text-xs">
                  <span className={!modoColar ? "font-medium" : "text-muted-foreground"}>Manual</span>
                  <Switch checked={modoColar} onCheckedChange={setModoColar} />
                  <span className={modoColar ? "font-medium" : "text-muted-foreground"}>Colar lista</span>
                </div>
              </div>

              {modoColar ? (
                <Textarea
                  value={palpitesTexto}
                  onChange={(e) => setPalpitesTexto(e.target.value)}
                  rows={Math.max(5, palpitesCount)}
                  placeholder={"01,02,03,04,05,06,07,08,09,10,11,12,13,14,15\n01,03,05,07,09,11,13,15,17,19,21,23,24,25,22"}
                  className="font-mono text-xs"
                />
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {Array.from({ length: palpitesCount }).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <span className="text-xs text-muted-foreground">Palpite {i + 1}</span>
                      <Input
                        value={(palpitesManuais[i] || []).join(",")}
                        onChange={(e) => {
                          const next = [...palpitesManuais];
                          next[i] = e.target.value.split(",").map((s) => s.trim());
                          setPalpitesManuais(next);
                        }}
                        placeholder={`Ex: 01,02,03,...`}
                        className="font-mono text-xs"
                      />
                    </div>
                  ))}
                  {palpitesCount === 0 && (
                    <p className="text-xs text-muted-foreground">Defina a quantidade de palpites acima.</p>
                  )}
                </div>
              )}
            </div>

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

