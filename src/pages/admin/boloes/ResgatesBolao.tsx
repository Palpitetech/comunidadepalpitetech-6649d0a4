import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function ResgatesBolao() {
  const { data: resgates, isLoading } = useQuery({
    queryKey: ["admin-bolao-resgates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bolao_resgates")
        .select("*, boloes(codigo), perfis(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <MainLayout pageTitle="Resgates">
      <div className="px-4 py-3 md:container-senior md:py-8">
        <Card>
          <CardHeader>
            <CardTitle>Solicitações de Resgate</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !resgates?.length ? (
              <p className="text-center text-sm text-muted-foreground py-10">
                Nenhuma solicitação de resgate ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Bolão</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resgates.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{r.perfis?.nome || "—"}</TableCell>
                      <TableCell className="text-sm">{r.boloes?.codigo || "—"}</TableCell>
                      <TableCell className="text-sm">R${parseFloat(r.valor).toFixed(2)}</TableCell>
                      <TableCell className="text-sm">{r.status}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(r.created_at).toLocaleDateString("pt-BR")}
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
