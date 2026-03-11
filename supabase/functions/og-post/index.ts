import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const postId = url.searchParams.get("id");
  const COMMUNITY_BASE_URL = Deno.env.get("COMMUNITY_BASE_URL") || "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const redirectUrl = `${COMMUNITY_BASE_URL.replace(/\/+$/, "")}/comunidade/post/${postId}`;

  if (!postId) {
    return Response.redirect(COMMUNITY_BASE_URL || "https://comunidadepalpitetech.lovable.app", 302);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: post } = await supabase
      .from("postagens")
      .select("id, titulo, conteudo, media_url, loteria_tag, created_at")
      .eq("id", postId)
      .single();

    if (!post) {
      return Response.redirect(redirectUrl, 302);
    }

    // Prepare OG data
    const title = post.titulo || "Post na Comunidade Palpite Tech";
    const description = (post.conteudo || "")
      .replace(/[#*_~`]/g, "")
      .substring(0, 200)
      .trim() + (post.conteudo && post.conteudo.length > 200 ? "..." : "");
    
    const siteName = "Palpite Tech";
    const ogImage = post.media_url || `${COMMUNITY_BASE_URL.replace(/\/+$/, "")}/logo.png`;
    const tag = post.loteria_tag ? ` | ${post.loteria_tag}` : "";

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}${tag} - ${siteName}</title>
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:image" content="${escapeAttr(ogImage)}">
  <meta property="og:url" content="${escapeAttr(redirectUrl)}">
  <meta property="og:site_name" content="${siteName}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeAttr(title)}">
  <meta name="twitter:description" content="${escapeAttr(description)}">
  <meta name="twitter:image" content="${escapeAttr(ogImage)}">
  
  <!-- Redirect -->
  <meta http-equiv="refresh" content="0;url=${escapeAttr(redirectUrl)}">
  <script>window.location.replace("${redirectUrl.replace(/"/g, '\\"')}");</script>
</head>
<body>
  <p>Redirecionando para <a href="${escapeAttr(redirectUrl)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err: any) {
    console.error("og-post error:", err);
    return Response.redirect(redirectUrl, 302);
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
