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
    // ==========================================
    // 1. 保存/发布代码片段: POST /api/snippets
    // ==========================================
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

      // ==========================================
      // 防重复写入检测 (Idempotent & Deduplication Check)
      // ==========================================
      let existingSnippet: any = null;

      // 1. 先检查 D1 是否已有同 id 或同 slug 记录
      if (db) {
        existingSnippet = await db.prepare("SELECT * FROM snippets WHERE id = ? OR slug = ?").bind(snippetId, slug).first();
      } else if (kv) {
        // 2. 检查 KV 是否已有对应记录
        const existingRaw = await kv.get(`snippet:${slug}`);
        if (existingRaw) {
          try {
            existingSnippet = JSON.parse(existingRaw);
          } catch {}
        }
      }

      // 如果数据内容完全一致，直接跳过数据库与 KV 写入，避免重复写入与无谓开销
      if (existingSnippet) {
        const existingHtml = existingSnippet.html || "";
        const existingCss = existingSnippet.css || "";
        const existingJs = existingSnippet.js || "";
        const existingTitle = existingSnippet.title || "";
        const existingDesc = existingSnippet.description || "";
        const existingPublic = existingSnippet.is_public !== undefined ? Boolean(existingSnippet.is_public) : Boolean(existingSnippet.isPublic);
        const existingPasscode = existingSnippet.passcode || null;
        const newPasscode = snippetData.passcode || null;

        const isExactMatch =
          existingHtml === snippetData.html &&
          existingCss === snippetData.css &&
          existingJs === snippetData.js &&
          existingTitle === snippetData.title &&
          existingDesc === snippetData.description &&
          existingPublic === snippetData.isPublic &&
          existingPasscode === newPasscode;

        if (isExactMatch) {
          const finalSlug = existingSnippet.slug || slug;
          return json({
            success: true,
            message: "数据未发生变更，已为您直接使用现有记录（无重复写入）",
            shareUrl: `/s/${finalSlug}`,
            rawUrl: `/raw/${finalSlug}`,
            data: {
              ...snippetData,
              id: existingSnippet.id || snippetId,
              slug: finalSlug,
              createdAt: existingSnippet.created_at || existingSnippet.createdAt || now,
              updatedAt: existingSnippet.updated_at || existingSnippet.updatedAt || now,
              views: existingSnippet.views || 0,
              forksCount: existingSnippet.forks_count || existingSnippet.forksCount || 0,
              passcode: undefined,
            },
          });
        }
      }

      // 存储逻辑 A: 如果绑定了 D1 关系型数据库 (D1 为主存储，绝不向 KV 重复写入冗余索引和别名)
      if (db) {
        // 检查 slug 唯一性冲突 (当创建新片段或修改 slug 时)
        const slugOwner = await db.prepare("SELECT id FROM snippets WHERE slug = ?").bind(slug).first();
        if (slugOwner && slugOwner.id !== snippetId) {
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
            slug = excluded.slug,
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
      } else if (kv) {
        // 存储逻辑 B: 仅当未配置 D1 时，才使用纯 KV 单一主键存储 (杜绝多键冗余与重复全表索引写入)
        const kvExpiration = expiresInHours ? { expirationTtl: expiresInHours * 3600 } : undefined;
        // 统一只写单主键 snippet:${slug}
        await kv.put(`snippet:${slug}`, JSON.stringify(snippetData), kvExpiration);
      }

      const shareUrl = `/s/${slug}`;
      const rawUrl = `/raw/${slug}`;

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

    // ==========================================
    // 2. 读取单个片段详情: GET /api/snippets/:idOrSlug
    // ==========================================
    if (pathname.startsWith("/api/snippets/") && method === "GET" && !pathname.includes("/fork")) {
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
        if (!raw) {
          raw = await kv.get(idOrSlug);
        }
        if (!raw) {
          raw = await kv.get(`html:${idOrSlug}`);
          if (raw && typeof raw === "string" && (raw.includes("<!DOCTYPE") || raw.includes("<html") || raw.includes("<div"))) {
            foundSnippet = {
              id: idOrSlug,
              slug: idOrSlug,
              title: "Hosted Snippet",
              html: raw,
              css: "",
              js: "",
              isPublic: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              views: 1,
              tags: ["kv"],
            };
            raw = null;
          }
        }
        if (raw && !foundSnippet) {
          try {
            foundSnippet = JSON.parse(raw);
          } catch (e) {
            foundSnippet = {
              id: idOrSlug,
              slug: idOrSlug,
              title: "Hosted Snippet",
              html: raw,
              css: "",
              js: "",
              isPublic: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
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

    // ==========================================
    // 3. 用户删除片段: DELETE /api/snippets/:idOrSlug
    // ==========================================
    if (pathname.startsWith("/api/snippets/") && method === "DELETE") {
      const parts = pathname.split("/");
      const idOrSlug = parts[parts.length - 1];
      let body: any = {};
      try {
        body = await request.json();
      } catch {}
      const inputPasscode = body.passcode || searchParams.get("passcode") || "";

      if (db) {
        const item = await db.prepare("SELECT * FROM snippets WHERE id = ? OR slug = ?").bind(idOrSlug, idOrSlug).first();
        if (item) {
          if (item.passcode && item.passcode.trim() && item.passcode !== inputPasscode) {
            return json({ success: false, error: "密码验证失败，无法删除该保护片段" }, 403);
          }
          await db.prepare("DELETE FROM snippets WHERE id = ? OR slug = ?").bind(idOrSlug, idOrSlug).run();
        }
      }

      if (kv) {
        const raw = await kv.get(`snippet:${idOrSlug}`);
        if (raw) {
          try {
            const item = JSON.parse(raw);
            if (item.passcode && item.passcode.trim() && item.passcode !== inputPasscode) {
              return json({ success: false, error: "密码验证失败，无法删除该保护片段" }, 403);
            }
            await kv.delete(`snippet:${item.slug}`);
          } catch {
            await kv.delete(`snippet:${idOrSlug}`);
          }
        } else {
          await kv.delete(`snippet:${idOrSlug}`);
        }
        // 清理历史冗余别名键（若有）
        await kv.delete(`snippet_id:${idOrSlug}`);
      }

      return json({ success: true, message: "片段已成功删除" });
    }

    // ==========================================
    // 4. Fork 代码片段: POST /api/snippets/:slug/fork
    // ==========================================
    if (pathname.includes("/fork") && method === "POST") {
      const parts = pathname.split("/");
      const parentSlug = parts[parts.length - 2];
      let foundParent: any = null;

      if (kv) {
        const raw = await kv.get(`snippet:${parentSlug}`);
        if (raw) foundParent = JSON.parse(raw);
      }
      if (!foundParent && db) {
        const row = await db.prepare("SELECT * FROM snippets WHERE slug = ?").bind(parentSlug).first();
        if (row) {
          foundParent = { ...row, tags: row.tags ? JSON.parse(row.tags) : [] };
        }
      }

      if (!foundParent) {
        return json({ success: false, error: "原代码片段不存在" }, 404);
      }

      const newSlug = generateRandomSlug(6);
      const newId = `snp_${generateRandomSlug(8)}`;
      const now = new Date().toISOString();

      const forkedSnippet = {
        ...foundParent,
        id: newId,
        slug: newSlug,
        title: `${foundParent.title} (Fork)`,
        forkedFrom: parentSlug,
        views: 0,
        forksCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      if (db) {
        await db.prepare("UPDATE snippets SET forks_count = forks_count + 1 WHERE slug = ?").bind(parentSlug).run();
        await db.prepare(`
          INSERT INTO snippets (
            id, slug, title, description, html, css, js,
            is_public, passcode, expires_at, created_at, updated_at,
            views, forks_count, forked_from, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
        `).bind(
          newId,
          newSlug,
          forkedSnippet.title,
          forkedSnippet.description,
          forkedSnippet.html,
          forkedSnippet.css,
          forkedSnippet.js,
          1,
          null,
          null,
          now,
          now,
          parentSlug,
          JSON.stringify(forkedSnippet.tags || [])
        ).run();
      }

      if (kv) {
        await kv.put(`snippet:${newSlug}`, JSON.stringify(forkedSnippet));
      }

      return json({
        success: true,
        message: "已成功基于该作品创建新副本",
        data: {
          slug: newSlug,
          shareUrl: `/s/${newSlug}`,
          rawUrl: `/raw/${newSlug}`,
          snippet: forkedSnippet,
        },
      });
    }

    // ==========================================
    // 5. 广场公开列表: GET /api/snippets 或 GET /api/explore
    // ==========================================
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
            (s.title || "").toLowerCase().includes(q) ||
            (s.description || "").toLowerCase().includes(q) ||
            (s.slug || "").toLowerCase().includes(q)
          );
        }

        return json({ success: true, count: list.length, data: list });
      }

      // 如果仅有 KV (通过原生前缀列表扫描，不维护冗余全库大数组)
      if (kv) {
        let list: any[] = [];
        try {
          const listed = await kv.list({ prefix: "snippet:" });
          if (listed && listed.keys && listed.keys.length > 0) {
            const keysToFetch = listed.keys.slice(0, 50);
            const items = await Promise.all(
              keysToFetch.map(async (k: any) => {
                const raw = await kv.get(k.name);
                if (!raw) return null;
                try {
                  const parsed = JSON.parse(raw);
                  if (parsed.isPublic !== false && !parsed.passcode) {
                    return {
                      id: parsed.id,
                      slug: parsed.slug,
                      title: parsed.title,
                      description: parsed.description,
                      createdAt: parsed.createdAt,
                      views: parsed.views || 0,
                      tags: parsed.tags || [],
                    };
                  }
                  return null;
                } catch {
                  return null;
                }
              })
            );
            list = items.filter(Boolean);
          }
        } catch {
          const indexRaw = await kv.get("public_snippets_index");
          list = indexRaw ? JSON.parse(indexRaw) : [];
        }

        if (q) {
          list = list.filter((s: any) =>
            (s.title || "").toLowerCase().includes(q) ||
            (s.description || "").toLowerCase().includes(q) ||
            (s.slug || "").toLowerCase().includes(q)
          );
        }
        return json({ success: true, count: list.length, data: list });
      }

      return json({ success: true, count: 0, data: [] });
    }

    // ==========================================
    // 6. 后台管理接口 (Cloudflare Pages Functions 版)
    // ==========================================

    // 6.1 管理员登录: POST /api/admin/login
    if (pathname === "/api/admin/login" && method === "POST") {
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        return json({ success: false, error: "无效的请求参数" }, 400);
      }
      const { username, password } = body;
      const adminUser = env.ADMIN_USERNAME || "admin";
      let adminPass = env.ADMIN_PASSWORD || "123456";

      // 优先支持从 KV 中读取自定义管理员密码
      if (kv) {
        const customPass = await kv.get("admin_custom_password");
        if (customPass) adminPass = customPass;
      }

      if (username === adminUser && password === adminPass) {
        const token = `adm_${btoa(`${username}:${Date.now()}:${Math.random()}`)}`;
        if (kv) {
          await kv.put(`admin_session:${token}`, username, { expirationTtl: 86400 * 7 });
        }
        return json({
          success: true,
          token,
          user: { username, role: "admin" },
          message: "管理员登录成功",
        });
      }

      return json({ success: false, error: "管理员账号或密码错误" }, 401);
    }

    // 6.2 校验 Token: POST /api/admin/verify
    if (pathname === "/api/admin/verify" && (method === "POST" || method === "GET")) {
      const authHeader = request.headers.get("Authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (!token) {
        return json({ success: false, error: "未授权" }, 401);
      }
      if (token.startsWith("adm_")) {
        return json({ success: true, valid: true, user: { username: "admin", role: "admin" } });
      }
      return json({ success: false, error: "登录会话已过期" }, 401);
    }

    // 6.3 后台仪表盘数据统计: GET /api/admin/stats
    if (pathname === "/api/admin/stats" && method === "GET") {
      if (db) {
        const countRow = await db.prepare("SELECT COUNT(*) as total, SUM(views) as totalViews FROM snippets").first();
        return json({
          success: true,
          stats: {
            totalSnippets: countRow?.total || 0,
            totalViews: countRow?.totalViews || 0,
            storageUsedBytes: 0,
            activeTokens: 1,
            databaseType: "Cloudflare D1 (SQLite)",
          },
        });
      }

      if (kv) {
        let count = 0;
        let totalViews = 0;
        try {
          const listed = await kv.list({ prefix: "snippet:" });
          count = listed?.keys?.length || 0;
        } catch {}

        return json({
          success: true,
          stats: {
            totalSnippets: count,
            totalViews,
            storageUsedBytes: 0,
            activeTokens: 1,
            databaseType: "Cloudflare KV",
          },
        });
      }

      return json({
        success: true,
        stats: {
          totalSnippets: 0,
          totalViews: 0,
          storageUsedBytes: 0,
          activeTokens: 1,
          databaseType: "KV / D1 未绑定 (请在 Pages 设置中绑定 KV_SNIPPETS)",
        },
      });
    }

    // 6.4 后台管理列表: GET /api/admin/snippets
    if (pathname === "/api/admin/snippets" && method === "GET") {
      if (db) {
        const { results } = await db.prepare("SELECT * FROM snippets ORDER BY created_at DESC LIMIT 200").all();
        const list = results.map((r: any) => ({
          ...r,
          isPublic: Boolean(r.is_public),
          hasPasscode: Boolean(r.passcode && r.passcode.trim()),
          tags: r.tags ? JSON.parse(r.tags) : [],
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
        return json({ success: true, count: list.length, data: list });
      }

      if (kv) {
        let list: any[] = [];
        try {
          const listed = await kv.list({ prefix: "snippet:" });
          if (listed && listed.keys && listed.keys.length > 0) {
            const keysToFetch = listed.keys.slice(0, 100);
            const items = await Promise.all(
              keysToFetch.map(async (k: any) => {
                const raw = await kv.get(k.name);
                if (!raw) return null;
                try {
                  const s = JSON.parse(raw);
                  return {
                    id: s.id,
                    slug: s.slug,
                    title: s.title,
                    description: s.description,
                    isPublic: s.isPublic !== false,
                    hasPasscode: Boolean(s.passcode && s.passcode.trim()),
                    passcode: s.passcode || "",
                    expiresAt: s.expiresAt || null,
                    createdAt: s.createdAt,
                    updatedAt: s.updatedAt,
                    views: s.views || 0,
                    forksCount: s.forksCount || 0,
                    tags: s.tags || [],
                  };
                } catch {
                  return null;
                }
              })
            );
            list = items.filter(Boolean);
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
        } catch {}
        return json({ success: true, count: list.length, data: list });
      }

      return json({ success: true, count: 0, data: [] });
    }

    // 6.5 后台修改代码片段元数据: PUT /api/admin/snippets/:id
    if (pathname.startsWith("/api/admin/snippets/") && method === "PUT") {
      const parts = pathname.split("/");
      const idOrSlug = parts[parts.length - 1];
      const body = await request.json();
      const { title, slug, description, passcode, isPublic, tags } = body;
      const now = new Date().toISOString();

      if (db) {
        await db.prepare(`
          UPDATE snippets SET
            title = ?, slug = ?, description = ?, passcode = ?, is_public = ?, tags = ?, updated_at = ?
          WHERE id = ? OR slug = ?
        `).bind(
          title || "",
          slug || "",
          description || "",
          passcode || null,
          isPublic ? 1 : 0,
          JSON.stringify(tags || []),
          now,
          idOrSlug,
          idOrSlug
        ).run();
      }

      if (kv) {
        let raw = await kv.get(`snippet:${idOrSlug}`);
        if (!raw) {
          const mapped = await kv.get(`snippet_id:${idOrSlug}`);
          if (mapped) raw = await kv.get(`snippet:${mapped}`);
        }
        if (raw) {
          const item = JSON.parse(raw);
          item.title = title !== undefined ? title : item.title;
          item.slug = slug !== undefined ? slug : item.slug;
          item.description = description !== undefined ? description : item.description;
          item.passcode = passcode !== undefined ? (passcode || undefined) : item.passcode;
          item.hasPasscode = Boolean(item.passcode && item.passcode.trim());
          item.isPublic = isPublic !== undefined ? Boolean(isPublic) : item.isPublic;
          item.tags = tags !== undefined ? tags : item.tags;
          item.updatedAt = now;
          await kv.put(`snippet:${item.slug}`, JSON.stringify(item));
        }

        // 更新后台索引
        const adminIdxRaw = await kv.get("all_snippets_admin_index");
        if (adminIdxRaw) {
          let list = JSON.parse(adminIdxRaw);
          list = list.map((s: any) => (s.id === idOrSlug || s.slug === idOrSlug) ? { ...s, title, slug, description, isPublic, tags, updatedAt: now } : s);
          await kv.put("all_snippets_admin_index", JSON.stringify(list));
        }
      }

      return json({ success: true, message: "元数据已更新" });
    }

    // 6.6 后台强制删除代码片段: DELETE /api/admin/snippets/:idOrSlug
    if (pathname.startsWith("/api/admin/snippets/") && method === "DELETE") {
      const parts = pathname.split("/");
      const idOrSlug = parts[parts.length - 1];

      if (db) {
        await db.prepare("DELETE FROM snippets WHERE id = ? OR slug = ?").bind(idOrSlug, idOrSlug).run();
      }

      if (kv) {
        await kv.delete(`snippet:${idOrSlug}`);
        await kv.delete(`snippet_id:${idOrSlug}`);
        const adminIdxRaw = await kv.get("all_snippets_admin_index");
        if (adminIdxRaw) {
          let list = JSON.parse(adminIdxRaw);
          list = list.filter((s: any) => s.id !== idOrSlug && s.slug !== idOrSlug);
          await kv.put("all_snippets_admin_index", JSON.stringify(list));
        }
        const indexRaw = await kv.get("public_snippets_index");
        if (indexRaw) {
          let list = JSON.parse(indexRaw);
          list = list.filter((s: any) => s.id !== idOrSlug && s.slug !== idOrSlug);
          await kv.put("public_snippets_index", JSON.stringify(list));
        }
      }

      return json({ success: true, message: "片段已成功删除" });
    }

    // 6.7 导出全库数据: GET /api/admin/export
    if (pathname === "/api/admin/export" && method === "GET") {
      let exportData: any[] = [];
      if (db) {
        const { results } = await db.prepare("SELECT * FROM snippets").all();
        exportData = results.map((r: any) => ({
          ...r,
          isPublic: Boolean(r.is_public),
          tags: r.tags ? JSON.parse(r.tags) : [],
        }));
      } else if (kv) {
        const adminIdxRaw = await kv.get("all_snippets_admin_index");
        if (adminIdxRaw) {
          exportData = JSON.parse(adminIdxRaw);
        } else {
          const indexRaw = await kv.get("public_snippets_index");
          exportData = indexRaw ? JSON.parse(indexRaw) : [];
        }
      }
      return new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="htmlshare_backup_${Date.now()}.json"`,
        },
      });
    }

    // 6.8 导入全库数据: POST /api/admin/import
    if (pathname === "/api/admin/import" && method === "POST") {
      const { data, mode = "merge" } = await request.json();
      if (!Array.isArray(data)) {
        return json({ success: false, error: "导入的数据必须是数组格式" }, 400);
      }

      let importedCount = 0;
      if (kv) {
        let adminList: any[] = mode === "replace" ? [] : (await kv.get("all_snippets_admin_index") ? JSON.parse(await kv.get("all_snippets_admin_index") || "[]") : []);
        for (const item of data) {
          if (!item.id || !item.slug) continue;
          await kv.put(`snippet:${item.slug}`, JSON.stringify(item));
          await kv.put(`snippet_id:${item.id}`, item.slug);
          adminList = adminList.filter((s: any) => s.id !== item.id && s.slug !== item.slug);
          adminList.unshift(item);
          importedCount++;
        }
        await kv.put("all_snippets_admin_index", JSON.stringify(adminList));
      }

      return json({ success: true, message: `成功导入 ${importedCount} 条代码片段记录`, total: importedCount });
    }

    // 6.9 清理过期片段: POST /api/admin/snippets/clean-expired 或 POST /api/admin/clean-expired
    if ((pathname === "/api/admin/snippets/clean-expired" || pathname === "/api/admin/clean-expired") && method === "POST") {
      let cleanedCount = 0;
      if (db) {
        const now = new Date().toISOString();
        const res = await db.prepare("DELETE FROM snippets WHERE expires_at IS NOT NULL AND expires_at < ?").bind(now).run();
        cleanedCount = res.meta?.changes || 0;
      }
      if (kv) {
        const adminIdxRaw = await kv.get("all_snippets_admin_index");
        if (adminIdxRaw) {
          const list = JSON.parse(adminIdxRaw);
          const now = new Date();
          const validList = list.filter((s: any) => !s.expiresAt || new Date(s.expiresAt) > now);
          cleanedCount = list.length - validList.length;
          await kv.put("all_snippets_admin_index", JSON.stringify(validList));
        }
      }
      return json({ success: true, message: `已成功清理 ${cleanedCount} 个过期片段`, removedCount: cleanedCount, count: cleanedCount });
    }

    // 6.10 修改管理员密码: POST /api/admin/change-password
    if (pathname === "/api/admin/change-password" && method === "POST") {
      const { newPassword } = await request.json();
      if (!newPassword || newPassword.length < 6) {
        return json({ success: false, error: "新密码长度至少需要 6 位" }, 400);
      }
      if (kv) {
        await kv.put("admin_custom_password", newPassword);
      }
      return json({ success: true, message: "密码修改成功，请重新登录" });
    }

    // ==========================================
    // 7. URL 外部抓取代理: POST /api/fetch-url
    // ==========================================
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

    // ==========================================
    // 8. 导出 Cloudflare 架构配置: GET /api/cloudflare/export
    // ==========================================
    if (pathname === "/api/cloudflare/export" && method === "GET") {
      return json({
        success: true,
        schemaSql: `-- Cloudflare D1 关系型数据库建表脚本
CREATE TABLE IF NOT EXISTS snippets (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  html TEXT,
  css TEXT,
  js TEXT,
  is_public INTEGER DEFAULT 1,
  passcode TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  forked_from TEXT,
  tags TEXT
);
CREATE INDEX IF NOT EXISTS idx_snippets_slug ON snippets(slug);
CREATE INDEX IF NOT EXISTS idx_snippets_public ON snippets(is_public);
`,
        wranglerJson: `// wrangler.jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "html2web",
  "main": "worker.js",
  "compatibility_date": "2024-09-01",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "htmlshare_db",
      "database_id": "YOUR_D1_DATABASE_ID_HERE"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "KV_SNIPPETS",
      "id": "YOUR_KV_NAMESPACE_ID_HERE"
    }
  ]
}`,
        workerCode: "// Cloudflare Worker 源码已同步于 worker.js",
        pagesFunctionCode: "// Cloudflare Pages Functions 源码已同步于 functions/api/[[route]].ts",
      });
    }

    // ==========================================
    // 9. 健康检查: GET /api/health
    // ==========================================
    if (pathname === "/api/health") {
      return json({
        status: "ok",
        service: "HTMLShare Cloudflare Pages Serverless",
        hasKV: Boolean(kv),
        hasDB: Boolean(db),
        time: new Date().toISOString(),
      });
    }

    return json({ success: false, error: `API 路径不存在: ${method} ${pathname}` }, 404);
  } catch (err: any) {
    return json({ success: false, error: err.message || "服务处理发生异常" }, 500);
  }
};
