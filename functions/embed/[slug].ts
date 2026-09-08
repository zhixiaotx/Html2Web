/**
 * Cloudflare Pages Functions - /embed/:slug 嵌入模式
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Snippet-Passcode",
};

export const onRequestGet = async (context: any) => {
  const { request, env, params } = context;
  const slug = params.slug as string;
  const url = new URL(request.url);
  const inputPasscode = url.searchParams.get("passcode") || request.headers.get("x-snippet-passcode") || "";

  const kv = env.KV_SNIPPETS || env.HTMLSHARE_KV || env.KV || null;
  const db = env.DB || env.D1 || null;

  let snippet: any = null;

  if (kv) {
    let raw = await kv.get(`snippet:${slug}`);
    if (!raw) {
      const mappedSlug = await kv.get(`snippet_id:${slug}`);
      if (mappedSlug) raw = await kv.get(`snippet:${mappedSlug}`);
    }
    if (!raw) raw = await kv.get(slug);
    if (!raw) raw = await kv.get(`html:${slug}`);
    if (raw) {
      try {
        snippet = JSON.parse(raw);
      } catch (e) {
        snippet = { id: slug, slug, title: "Embed", html: raw, css: "", js: "", isPublic: true };
      }
    }
  }

  if (!snippet && db) {
    const row = await db.prepare("SELECT * FROM snippets WHERE slug = ? OR id = ?")
      .bind(slug, slug)
      .first();
    if (row) snippet = row;
  }

  if (!snippet) {
    return new Response("404 - Snippet not found", { status: 404, headers: corsHeaders });
  }

  if (snippet.passcode && snippet.passcode.trim() && snippet.passcode !== inputPasscode) {
    return new Response("401 - Protected", { status: 401, headers: corsHeaders });
  }

  const rawHtml = (snippet.html || "").trim();
  const rawCss = (snippet.css || "").trim();
  const rawJs = (snippet.js || "").trim();
  const isFullDoc = /<!DOCTYPE\s+html/i.test(rawHtml) || /<html[\s>]/i.test(rawHtml);

  let fullHtml = "";
  if (isFullDoc) {
    fullHtml = rawHtml;
    if (rawCss) {
      const styleTag = `<style>\n${rawCss}\n</style>`;
      fullHtml = /<\/head>/i.test(fullHtml) ? fullHtml.replace(/<\/head>/i, `${styleTag}\n</head>`) : `${styleTag}\n${fullHtml}`;
    }
    if (rawJs) {
      const scriptTag = `<script>\n${rawJs}\n</script>`;
      fullHtml = /<\/body>/i.test(fullHtml) ? fullHtml.replace(/<\/body>/i, `${scriptTag}\n</body>`) : `${fullHtml}\n${scriptTag}`;
    }
  } else {
    fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${snippet.title || "Embed"}</title>${rawCss ? `<style>${rawCss}</style>` : ""}</head><body>${rawHtml}${rawJs ? `<script>${rawJs}</script>` : ""}</body></html>`;
  }

  return new Response(fullHtml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
};
