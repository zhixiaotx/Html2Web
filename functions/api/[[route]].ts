/**
 * Cloudflare Pages Functions - /api/[[route]]
 * 适用于 Cloudflare Pages 部署时的完整 Serverless 后端路由处理
 * 支持直接绑定 KV (`KV_SNIPPETS` 或 `HTMLSHARE_KV`) 与 D1 (`DB`)
 * 同时支持纯 KV 模式与 D1+KV 模式持久化
 */

// 跨域 CORS 响应头
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Snippet-Passcode",
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });

function getKv(env: any) {
  return env.KV_SNIPPETS || env.HTMLSHARE_KV || env.KV || null;
}

function getDb(env: any) {
  return env.DB || env.D1 || null;
}

function generateRandomSlug(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const { pathname, searchParams } = url;
  const method = request.method;

  if (method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const kv = getKv(env);
  const db = getDb(env);

  try {
    // 1. 保存/发布代码片段: POST /api/snippets
    if (pathname === "/api/snippets" && method === "POST") {
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        return json({ success: false, error: "请求数据格式错误，请传递有效的 JSON" }, 400);
      }

      const {
        id,
        slug: requestedSlug,
        title,
        description,
        html,
        css,
        js,
        isPublic = true,
        passcode,
        expiresInHours,
        tags = [],
        forkedFrom,
      } = body;

      if (!html && !css && !js) {
        return json({ success: false, error: "代码内容不能为空" }, 400);
      }

      let slug = (requestedSlug || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!slug) {
        slug = generateRandomSlug(6);
      }

      const snippetId = id || `snp_${generateRandomSlug(8)}`;
      const now = new Date().toISOString();
      let expiresAt: string | null = null;
      if (expiresInHours && typeof expiresInHours === "number") {
        const d = new Date();
        d.setHours(d.getHours() + expiresInHours);
        expiresAt = d.toISOString();
      }

      const snippetData = {
        id: snippetId,
        slug,
        title: title || "未命名 HTML 片段",
        description: description || "",
        html: html || "",
        css: css || "",
        js: js || "",
        isPublic: Boolean(isPublic),
        hasPasscode: Boolean(passcode && passcode.trim()),
        passcode: passcode && passcode.trim() ? passcode.trim() : undefined,
        expiresAt,
        createdAt: now,
        updatedAt: now,
        views: 0,
        forksCount: 0,
        forkedFrom: forkedFrom || null,
        tags: Array.isArray(tags) ? tags : [],
      };

      // 存储逻辑 A: 如果绑定了 D1 关系型数据库
      if (db) {
        // 检查 slug 唯一性
        const existing = await db.prepare("SELECT id FROM snippets WHERE slug = ?").bind(slug).first();
        if (existing && existing.id !== snippetId) {
          slug = `${slug}-${generateRandomSlug(3)}`;
          snippetData.slug = slug;
        }

        await db.prepare(`
          INSERT INTO snippets (
            id, slug, title, description, html, css, js,
            is_public, passcode, expires_at, created_at, updated_at,
            views, forks_count, forked_from, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            description = excluded.description,
            html = excluded.html,
            css = excluded.css,
            js = excluded.js,
            is_public = excluded.is_public,
            passcode = excluded.passcode,
            expires_at = excluded.expires_at,
            updated_at = excluded.updated_at,
            tags = excluded.tags
        `).bind(
          snippetId,
          slug,
          snippetData.title,
          snippetData.description,
          snippetData.html,
          snippetData.css,
          snippetData.js,
          snippetData.isPublic ? 1 : 0,
          snippetData.passcode || null,
          snippetData.expiresAt || null,
          now,
          now,
          snippetData.forkedFrom || null,
          JSON.stringify(snippetData.tags)
        ).run();
      }

      // 存储逻辑 B: 存储至 KV 数据库
      if (kv) {
        // 保存片段数据
        const kvExpiration = expiresInHours ? { expirationTtl: expiresInHours * 3600 } : undefined;
        await kv.put(`snippet:${slug}`, JSON.stringify(snippetData), kvExpiration);
        if (slug !== snippetId) {
          await kv.put(`snippet_id:${snippetId}`, slug, kvExpiration);
        }

        // 维护公共片段索引列表 (用于广场探索)
        if (snippetData.isPublic && !snippetData.passcode) {
          try {
            const indexRaw = await kv.get("public_snippets_index");
            let indexList: any[] = indexRaw ? JSON.parse(indexRaw) : [];
            indexList = indexList.filter((item: any) => item.slug !== slug);
            indexList.unshift({
              id: snippetId,
              slug,
              title: snippetData.title,
              description: snippetData.description,
              createdAt: now,
              views: 0,
              tags: snippetData.tags,
            });
            if (indexList.length > 100) indexList = indexList.slice(0, 100);
            await kv.put("public_snippets_index", JSON.stringify(indexList));
          } catch (e) {
            console.error("KV index error:", e);
          }
        }
      }

      const shareUrl = `${url.origin}/s/${slug}`;
      const rawUrl = `${url.origin}/raw/${slug}`;

      return json({
        success: true,
        shareUrl,
        rawUrl,
        data: {
          ...snippetData,
          passcode: undefined, // 不在返回中暴露明文密码
        },
      });
    }

    // 2. 读取单个片段详情: GET /api/snippets/:idOrSlug
    if (pathname.startsWith("/api/snippets/") && method === "GET") {
      const parts = pathname.split("/");
      const idOrSlug = parts[parts.length - 1];
      const inputPasscode = searchParams.get("passcode") || request.headers.get("x-snippet-passcode") || "";

      let foundSnippet: any = null;

      // 优先查 KV
      if (kv) {
        let raw = await kv.get(`snippet:${idOrSlug}`);
        if (!raw) {
          const mappedSlug = await kv.get(`snippet_id:${idOrSlug}`);
          if (mappedSlug) {
            raw = await kv.get(`snippet:${mappedSlug}`);
          }
        }
        if (raw) {
          foundSnippet = JSON.parse(raw);
        }
      }

      // 查 D1
      if (!foundSnippet && db) {
        const row = await db.prepare("SELECT * FROM snippets WHERE slug = ? OR id = ?")
          .bind(idOrSlug, idOrSlug)
          .first();
        if (row) {
          foundSnippet = {
            ...row,
            isPublic: Boolean(row.is_public),
            hasPasscode: Boolean(row.passcode && row.passcode.trim()),
            tags: row.tags ? JSON.parse(row.tags) : [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        }
      }

      if (!foundSnippet) {
        return json({ success: false, error: "代码片段不存在或已过期" }, 404);
      }

      const isProtected = Boolean(foundSnippet.passcode && foundSnippet.passcode.trim());
      const isUnlocked = !isProtected || (inputPasscode && inputPasscode === foundSnippet.passcode);

      return json({
        success: true,
        data: {
          ...foundSnippet,
          hasPasscode: isProtected,
          html: isUnlocked ? foundSnippet.html : "<!-- 🔒 该代码片段受密码保护，请输入密码后查看 -->",
          css: isUnlocked ? foundSnippet.css : "/* 🔒 Password Protected */",
          js: isUnlocked ? foundSnippet.js : "// 🔒 Password Protected",
          passcode: undefined,
        },
      });
    }

    // 3. 广场公开列表: GET /api/snippets 或 GET /api/explore
    if ((pathname === "/api/snippets" || pathname === "/api/explore") && method === "GET") {
      const q = (searchParams.get("q") || "").toLowerCase();

      // 如果有 D1
      if (db) {
        const { results } = await db.prepare(
          "SELECT id, slug, title, description, created_at, views, forks_count, tags, is_public FROM snippets WHERE is_public = 1 ORDER BY created_at DESC LIMIT 50"
        ).all();

        const formatted = results.map((r: any) => ({
          ...r,
          createdAt: r.created_at,
          tags: r.tags ? JSON.parse(r.tags) : [],
          hasPasscode: false,
        }));

        let list = formatted;
        if (q) {
          list = list.filter((s: any) =>
            s.title.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.slug.toLowerCase().includes(q)
          );
        }

        return json({ success: true, count: list.length, data: list });
      }

      // 如果有 KV
      if (kv) {
        const indexRaw = await kv.get("public_snippets_index");
        let list = indexRaw ? JSON.parse(indexRaw) : [];
        if (q) {
          list = list.filter((s: any) =>
            s.title.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.slug.toLowerCase().includes(q)
          );
        }
        return json({ success: true, count: list.length, data: list });
      }

      return json({ success: true, count: 0, data: [] });
    }

    // 4. URL 外部抓取代理: POST /api/fetch-url
    if (pathname === "/api/fetch-url" && method === "POST") {
      const { url: targetUrl } = await request.json();
      if (!targetUrl) {
        return json({ success: false, error: "缺少 URL 参数" }, 400);
      }

      let fetchTarget = targetUrl.trim();
      if (fetchTarget.includes("github.com/") && fetchTarget.includes("/blob/")) {
        fetchTarget = fetchTarget.replace("github.com/", "raw.githubusercontent.com/").replace("/blob/", "/");
      }

      const resp = await fetch(fetchTarget, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; HTMLShareBot/1.0; +https://htmlshare.pages.dev)",
        },
      });

      if (!resp.ok) {
        return json({ success: false, error: `无法获取该 URL 内容 (HTTP ${resp.status})` }, resp.status);
      }

      const content = await resp.text();
      return json({ success: true, content, sourceUrl: fetchTarget });
    }

    // 5. 健康检查
    if (pathname === "/api/health") {
      return json({
        status: "ok",
        service: "HTMLShare Cloudflare Pages Serverless",
        hasKV: Boolean(kv),
        hasDB: Boolean(db),
        time: new Date().toISOString(),
      });
    }

    return json({ success: false, error: "API 路径不存在" }, 404);
  } catch (err: any) {
    return json({ success: false, error: err.message || "服务处理发生异常" }, 500);
  }
};
