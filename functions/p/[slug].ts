/**
 * Cloudflare Pages Functions - /p/:slug 永久链接边缘直出渲染
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
    if (!raw) {
      raw = await kv.get(slug);
    }
    if (!raw) {
      raw = await kv.get(`html:${slug}`);
      if (raw && typeof raw === "string" && (raw.includes("<!DOCTYPE") || raw.includes("<html") || raw.includes("<div"))) {
        snippet = {
          id: slug,
          slug,
          title: "Hosted Snippet",
          html: raw,
          css: "",
          js: "",
          isPublic: true,
        };
        raw = null;
      }
    }
    if (raw && !snippet) {
      try {
        snippet = JSON.parse(raw);
      } catch (e) {
        snippet = {
          id: slug,
          slug,
          title: "Hosted Snippet",
          html: raw,
          css: "",
          js: "",
          isPublic: true,
        };
      }
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
    return new Response(
      "<!DOCTYPE html><html><head><meta charset='utf-8'><title>404 - 代码片段不存在</title></head><body style='font-family:sans-serif;padding:40px;text-align:center;'><h2>404 - 未找到该代码片段或已过期销毁</h2><p><a href='/'>返回 HTMLShare 主页</a></p></body></html>",
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  if (snippet.passcode && snippet.passcode.trim() && snippet.passcode !== inputPasscode) {
    return new Response(
      "<!DOCTYPE html><html><head><meta charset='utf-8'><title>401 - 受密码保护</title></head><body style='font-family:sans-serif;padding:40px;text-align:center;'><h2>🔒 该页面受访问密码保护</h2><p>请在主站输入访问密码或在 URL 中添加 <code>?passcode=您的密码</code></p></body></html>",
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
      }
    );
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
      if (/<\/head>/i.test(fullHtml)) {
        fullHtml = fullHtml.replace(/<\/head>/i, `${styleTag}\n</head>`);
      } else if (/<body[\s>]/i.test(fullHtml)) {
        fullHtml = fullHtml.replace(/<body([^>]*)>/i, `<body$1>\n${styleTag}`);
      } else {
        fullHtml = `${styleTag}\n${fullHtml}`;
      }
    }
    if (rawJs) {
      const scriptTag = `<script>\n${rawJs}\n</script>`;
      if (/<\/body>/i.test(fullHtml)) {
        fullHtml = fullHtml.replace(/<\/body>/i, `${scriptTag}\n</body>`);
      } else {
        fullHtml = `${fullHtml}\n${scriptTag}`;
      }
    }
  } else {
    const usesTailwind =
      rawHtml.includes("class=") &&
      (rawHtml.includes("flex") ||
        rawHtml.includes("text-") ||
        rawHtml.includes("bg-") ||
        rawHtml.includes("rounded") ||
        rawHtml.includes("grid") ||
        rawHtml.includes("dark:"));

    const tailwindScript =
      usesTailwind && !rawHtml.includes("tailwindcss.com")
        ? '  <script src="https://cdn.tailwindcss.com"></script>\n'
        : "";

    fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
  <title>${snippet.title || "HTMLShare 代码预览"}</title>
${tailwindScript}  ${rawCss ? `<style>\n${rawCss}\n</style>` : ""}
</head>
<body>
${rawHtml}
${rawJs ? `  <script>\n${rawJs}\n  </script>` : ""}
</body>
</html>`;
  }

  return new Response(fullHtml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
    },
  });
};
