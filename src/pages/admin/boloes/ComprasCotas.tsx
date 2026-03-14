import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ComprasCotas() {
  const { data: compras, isLoading } = useQuery({
    queryKey: ["admin-compras-cotas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saldo_transacoes")
        .select("*, perfis(nome)")
        .eq("tipo", "compra_cota")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <MainLayout pageTitle="Compras de Cotas">
      <div className="px-4 py-3 md:container-senior md:py-8">
        <Card>
          <CardHeader>
            <CardTitle>Compras de Cotas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !compras?.length ? (
              <p className="text-center text-sm text-muted-foreground py-10">
                Nenhuma compra de cotas ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Bolão</TableHead>
                    <TableHead>Cotas</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compras.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">{c.perfis?.nome || "—"}</TableCell>
                      <TableCell className="text-sm">{c.descricao || "—"}</TableCell>
                      <TableCell className="text-sm">—</TableCell>
                      <TableCell className="text-sm">R${parseFloat(c.valor).toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{c.status}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
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
