import { useParams, Navigate } from "react-router-dom";
import { AjudaTemplate } from "@/components/ajuda/AjudaTemplate";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const AjudaDetalhes = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Normalização de URL (slug sempre lowercase)
  const normalizedSlug = slug?.toLowerCase() || "";

  const { data: content, isLoading, error } = useQuery({
    queryKey: ["help-content", normalizedSlug],
    queryFn: async () => {
      if (!normalizedSlug) return null;
      
      const { data, error } = await supabase
        .from("help_content")
        .select("*")
        .eq("slug", normalizedSlug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!normalizedSlug,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <Skeleton className="h-40 w-full mb-10" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !content) {
    return <Navigate to="/404" replace />;
  }

  return <AjudaTemplate content={content as any} />;
};

export default AjudaDetalhes;
