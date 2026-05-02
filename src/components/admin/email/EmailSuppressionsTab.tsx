import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Suppression { email: string; reason: string; created_at: string; }

export function EmailSuppressionsTab() {
  const [items, setItems] = useState<Suppression[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("email_suppressions" as any).select("*").order("created_at", { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!newEmail) return;
    const { error } = await supabase.from("email_suppressions" as any).insert({ email: newEmail.toLowerCase().trim(), reason: "manual" });
    if (error) return toast.error(error.message);
    setNewEmail("");
    toast.success("Adicionado");
    load();
  };

  const remove = async (email: string) => {
    if (!confirm(`Remover ${email} da lista de bloqueados?`)) return;
    const { error } = await supabase.from("email_suppressions" as any).delete().eq("email", email);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm text-muted-foreground">Emails nesta lista não recebem mais nenhum envio (bounce, reclamação ou descadastro).</p>
      <div className="flex gap-2">
        <Input placeholder="email@exemplo.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="max-w-xs" />
        <Button size="sm" onClick={add}>Adicionar</Button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-1.5">
          {items.map((s) => (
            <Card key={s.email}>
              <CardContent className="p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{s.email}</span>
                  <span className="text-xs text-muted-foreground ml-2">({s.reason})</span>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(s.email)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
