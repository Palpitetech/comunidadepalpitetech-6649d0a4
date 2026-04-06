import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Construction } from "lucide-react";

export default function ComprasSaldo() {
  return (
    <AdminLayout pageTitle="Compras de Saldo">
      <div className="px-4 py-3 md:container-senior md:py-8">
        <Card>
          <CardHeader>
            <CardTitle>Compras de Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
              <Construction className="h-10 w-10 opacity-40" />
              <p className="font-medium">Em desenvolvimento</p>
              <p className="text-xs">A tabela de transações de saldo ainda não foi configurada.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
