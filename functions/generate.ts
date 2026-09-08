/**
 * Cloudflare Pages Functions - /generate
 * 兼容 wasmer 渲染器架构的快速生成永久链接 API
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Snippet-Passcode",
};

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

function generateRandomSlug(length = 6): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function normalizeRawUrl(inputUrl: string): string {
  let url = (inputUrl || "").trim();
  if (url.includes("github.com/") && url.includes("/blob/")) {
    url = url.replace("github.com/", "raw.githubusercontent.com/").replace("/blob/", "/");
  }
  if (url.includes("bitbucket.org/") && url.includes("/src/")) {
    url = url.replace("/src/", "/raw/");
  }
  if (url.includes("gitlab.com/") && url.includes("/-/blob/")) {
    url = url.replace("/-/blob/", "/-/raw/");
  }
  return url;
}

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { type, url, code } = body || {};

    let htmlContent = "";
    let title = "♡｡Sky.✨ 永久页面";

    if (type === "url") {
      if (!url) {
        return new Response(JSON.stringify({ success: false, error: "请输入有效的代码链接" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const normalizedUrl = normalizeRawUrl(url);
      const resp = await fetch(normalizedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 HTMLShare/1.0",
          Accept: "text/html,application/xhtml+xml,application/xml,text/plain,*/*",
        },
      });
      if (!resp.ok) {
        throw new Error(`远程链接抓取失败: HTTP ${resp.status}`);
      }
      htmlContent = await resp.text();
      const titleMatch = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) title = titleMatch[1].trim();
      else title = url.split("/").pop()?.split("?")[0] || "从 URL 生成的页面";
    } else if (type === "code") {
      if (!code || !code.trim()) {
        return new Response(JSON.stringify({ success: false, error: "请粘贴 HTML 代码" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      htmlContent = code;
      const titleMatch = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) title = titleMatch[1].trim();
    } else {
      return new Response(JSON.stringify({ success: false, error: "无效的生成请求类型" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const slug = generateRandomSlug(6);
    const newId = `snp_${generateRandomSlug(8)}`;
    const now = new Date().toISOString();

    const snippetObj = {
      id: newId,
      slug,
      title: title || "♡｡Sky.✨ 永久页面",
      description: "由 Sky 渲染器极简生成的永久链接页面",
      html: htmlContent,
      css: "",
      js: "",
      isPublic: true,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
      views: 0,
      forksCount: 0,
      tags: ["sky-renderer", type || "quick"],
    };

    const kv = env.KV_SNIPPETS || env.HTMLSHARE_KV || env.KV || null;
    const db = env.DB || env.D1 || null;

    if (kv) {
      await kv.put(`snippet:${slug}`, JSON.stringify(snippetObj));
      await kv.put(`snippet_id:${newId}`, slug);
      await kv.put(`html:${slug}`, htmlContent);
    }

    if (db) {
      await db.prepare(
        "INSERT INTO snippets (id, slug, title, description, html, css, js, is_public, created_at, updated_at, views, forks_count, tags) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0, 0, ?)"
      )
        .bind(
          newId,
          slug,
          snippetObj.title,
          snippetObj.description,
          snippetObj.html,
          snippetObj.css,
          snippetObj.js,
          now,
          now,
          JSON.stringify(snippetObj.tags)
        )
        .run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        code: slug,
        slug,
        url: `/p/${slug}`,
        rawUrl: `/raw/${slug}`,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "服务器处理异常",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
};
