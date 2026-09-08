/**
 * Cloudflare Pages Functions - /raw/:slug 及 /embed/:slug 边缘直出
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
    if (raw) {
      snippet = JSON.parse(raw);
    }
  }

  if (!snippet && db) {
    const row = await db.prepare("SELECT * FROM snippets WHERE slug = ? OR id = ?")
      .bind(slug, slug)
      .first();
    if (row) {
      snippet = row;
    }
  }

  if (!snippet) {
    return new Response("<!DOCTYPE html><html><head><meta charset='utf-8'><title>404 - 代码片段不存在</title></head><body style='font-family:sans-serif;padding:40px;text-align:center;'><h2>404 - 未找到该代码片段或已过期销毁</h2><p><a href='/'>返回 HTMLShare 主页</a></p></body></html>", {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (snippet.passcode && snippet.passcode.trim() && snippet.passcode !== inputPasscode) {
    return new Response("<!DOCTYPE html><html><head><meta charset='utf-8'><title>401 - 受密码保护</title></head><body style='font-family:sans-serif;padding:40px;text-align:center;'><h2>🔒 该页面受访问密码保护</h2><p>请在主站输入访问密码或在 URL 中添加 <code>?passcode=您的密码</code></p></body></html>", {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${snippet.title || "HTMLShare 代码预览"}</title>
  <style>
${snippet.css || ""}
  </style>
</head>
<body>
${snippet.html || ""}
  <script>
${snippet.js || ""}
  </script>
</body>
</html>`;

  return new Response(fullHtml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
};
