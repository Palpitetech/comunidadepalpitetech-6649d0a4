import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ComprasSaldo() {
  const { data: transacoes, isLoading } = useQuery({
    queryKey: ["admin-compras-saldo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saldo_transacoes")
        .select("*, perfis(nome)")
        .eq("tipo", "deposito")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <MainLayout pageTitle="Compras de Saldo">
      <div className="px-4 py-3 md:container-senior md:py-8">
        <Card>
          <CardHeader>
            <CardTitle>Compras de Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !transacoes?.length ? (
              <p className="text-center text-sm text-muted-foreground py-10">
                Nenhuma compra de saldo ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Referência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoes.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{t.perfis?.nome || "—"}</TableCell>
                      <TableCell className="text-sm">R${parseFloat(t.valor).toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{t.status}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(t.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[120px]">
                        {t.referencia_id || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
