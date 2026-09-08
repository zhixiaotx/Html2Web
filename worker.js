/**
 * HTMLShare - Cloudflare Worker + D1 关系库 + KV 边缘极速缓存
 * 全球毫秒级响应的前端代码托管与分享 Serverless 服务
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // 跨域 CORS 响应头
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Snippet-Passcode",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });

    try {
      // 1. 全球边缘极速直出: /raw/:slug 或 /embed/:slug
      if (pathname.startsWith("/raw/") || pathname.startsWith("/embed/")) {
        const isEmbed = pathname.startsWith("/embed/");
        const slug = pathname.replace(isEmbed ? "/embed/" : "/raw/", "");
        const inputPasscode = searchParams.get("passcode") || request.headers.get("X-Snippet-Passcode") || "";

        // 优先从 KV 边缘缓存获取已编译的完整 HTML (针对公开且免密代码)
        const cacheKey = `html:${slug}`;
        let cached = env.KV_SNIPPETS ? await env.KV_SNIPPETS.get(cacheKey) : null;

        // 若命中缓存且免密，直接毫秒级返回
        if (cached && !inputPasscode) {
          return new Response(cached, {
            headers: {
              ...corsHeaders,
              "Content-Type": "text/html; charset=utf-8",
              "X-Cache": "HIT-KV",
            },
          });
        }

        // 未命中或需鉴权，查 D1 数据库
        if (!env.DB) {
          return new Response("500 - Cloudflare D1 数据库未绑定 (请检查 wrangler.jsonc 中 DB 绑定)", {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
          });
        }

        const snippet = await env.DB.prepare("SELECT * FROM snippets WHERE slug = ? OR id = ?")
          .bind(slug, slug)
          .first();

        if (!snippet) {
          return new Response("404 - 代码片段不存在或已被清理", {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
          });
        }

        // 访问密码保护校验
        if (snippet.passcode && snippet.passcode.trim() && snippet.passcode !== inputPasscode) {
          return new Response("401 - 该页面受访问密码保护，请附带 ?passcode= 密码参数访问", {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
          });
        }

        // 异步递增浏览量 (非阻塞)
        ctx.waitUntil(
          env.DB.prepare("UPDATE snippets SET views = views + 1 WHERE id = ?")
            .bind(snippet.id)
            .run()
        );

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
  <\/script>
</body>
</html>`;

        // 如果无密码保护，且绑定了 KV，回写缓存 1 小时
        if (!snippet.passcode && env.KV_SNIPPETS) {
          ctx.waitUntil(env.KV_SNIPPETS.put(cacheKey, fullHtml, { expirationTtl: 3600 }));
        }

        return new Response(fullHtml, {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/html; charset=utf-8",
            "X-Cache": "MISS-D1",
          },
        });
      }

      // 2. 读取片段详情: GET /api/snippets/:idOrSlug
      if (pathname.startsWith("/api/snippets/") && request.method === "GET") {
        const idOrSlug = pathname.replace("/api/snippets/", "");
        const inputPasscode = searchParams.get("passcode") || request.headers.get("X-Snippet-Passcode") || "";

        if (!env.DB) return json({ success: false, error: "D1 数据库未绑定" }, 500);

        const snippet = await env.DB.prepare("SELECT * FROM snippets WHERE slug = ? OR id = ?")
          .bind(idOrSlug, idOrSlug)
          .first();

        if (!snippet) return json({ success: false, error: "代码片段不存在" }, 404);

        if (snippet.passcode && snippet.passcode.trim() && snippet.passcode !== inputPasscode) {
          return json({ success: false, error: "访问密码错误", requiresPasscode: true }, 401);
        }

        return json({
          success: true,
          data: {
            ...snippet,
            isPublic: Boolean(snippet.is_public),
            tags: snippet.tags ? JSON.parse(snippet.tags) : [],
          },
        });
      }

      // 3. 发布新代码片段: POST /api/snippets
      if (pathname === "/api/snippets" && request.method === "POST") {
        if (!env.DB) return json({ success: false, error: "D1 数据库未绑定" }, 500);

        const body = await request.json();
        const id = crypto.randomUUID();
        const slug = body.slug?.trim() || Math.random().toString(36).substring(2, 8);
        const now = new Date().toISOString();

        // 检查 slug 唯一性
        const existing = await env.DB.prepare("SELECT id FROM snippets WHERE slug = ?").bind(slug).first();
        if (existing) {
          return json({ success: false, error: "该个性化短链接已被占用，请更换" }, 409);
        }

        await env.DB.prepare(`
          INSERT INTO snippets (
            id, slug, title, description, html, css, js,
            is_public, passcode, expires_at, created_at, updated_at,
            views, forks_count, forked_from, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
        `).bind(
          id,
          slug,
          body.title || "未命名 HTML 片段",
          body.description || "",
          body.html || "",
          body.css || "",
          body.js || "",
          body.isPublic !== false ? 1 : 0,
          body.passcode || null,
          body.expiresAt || null,
          now,
          now,
          body.forkedFrom || null,
          JSON.stringify(body.tags || [])
        ).run();

        // 如果是公开无密码片段，预热写入 KV 缓存
        if (!body.passcode && env.KV_SNIPPETS) {
          const prewarmedHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${body.title || "HTMLShare"}</title><style>${body.css || ""}</style></head><body>${body.html || ""}<script>${body.js || ""}<\/script></body></html>`;
          ctx.waitUntil(env.KV_SNIPPETS.put(`html:${slug}`, prewarmedHtml, { expirationTtl: 3600 }));
        }

        return json({
          success: true,
          data: {
            id,
            slug,
            url: `${url.origin}/raw/${slug}`,
          },
        });
      }

      // 4. 广场公开列表: GET /api/explore
      if (pathname === "/api/explore" && request.method === "GET") {
        if (!env.DB) return json({ success: false, error: "D1 数据库未绑定" }, 500);

        const { results } = await env.DB.prepare(
          "SELECT id, slug, title, description, created_at, views, forks_count, tags FROM snippets WHERE is_public = 1 ORDER BY created_at DESC LIMIT 50"
        ).all();

        return json({
          success: true,
          data: results.map((r) => ({
            ...r,
            tags: r.tags ? JSON.parse(r.tags) : [],
          })),
        });
      }

      // 5. 默认状态健康探测
      return json({
        success: true,
        service: "HTMLShare Cloudflare Serverless Worker",
        d1Ready: Boolean(env.DB),
        kvReady: Boolean(env.KV_SNIPPETS),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return json({ success: false, error: err.message || "Worker 处理异常" }, 500);
    }
  }
};
