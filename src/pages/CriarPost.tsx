import { MainLayout } from "@/components/layout/MainLayout";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CriarPost() {
  return (
    <MainLayout>
      <div className="container-senior py-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <PlusCircle className="h-8 w-8 text-primary" />
          <h1 className="text-senior-2xl font-bold">Criar Post</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-senior-lg">Compartilhe seu palpite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Escreva seu palpite ou análise aqui..."
              className="min-h-[150px] text-senior-base"
            />
            <Button className="w-full h-12 text-senior-base bg-accent hover:bg-accent/90 text-accent-foreground">
              Publicar
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
