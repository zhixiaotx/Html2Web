import express from "express";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

interface StoredSnippet {
  id: string;
  slug: string;
  title: string;
  description: string;
  html: string;
  css: string;
  js: string;
  isPublic: boolean;
  passcode?: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  views: number;
  forksCount: number;
  forkedFrom: string | null;
  tags: string[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "htmlshare_db.json");

// Ensure data folder and storage file exist
async function initStorage(): Promise<StoredSnippet[]> {
  try {
    if (!existsSync(DATA_DIR)) {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
    if (!existsSync(DB_FILE)) {
      const initialData: StoredSnippet[] = [
        {
          id: "welcome-demo",
          slug: "welcome-demo",
          title: "✨ HTMLShare 欢迎示例 & 交互粒子卡片",
          description: "完全免费的代码片段分享平台，基于 Cloudflare D1 / KV 架构",
          html: `<div class="welcome-card">\n  <div class="badge">100% 免费 & 无需开会员</div>\n  <h1>🚀 HTMLShare 托管平台</h1>\n  <p>实时渲染、自定义短链、密码保护与 Cloudflare D1/KV 无缝同步</p>\n  <div class="actions">\n    <button id="counterBtn" class="btn primary">点击互动: <span id="count">0</span></button>\n    <button id="particleBtn" class="btn secondary">触发五彩纸屑 🎉</button>\n  </div>\n</div>`,
          css: `@import "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap";\n\nbody {\n  margin: 0;\n  padding: 0;\n  min-height: 100vh;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);\n  font-family: 'Plus Jakarta Sans', sans-serif;\n  color: #f8fafc;\n}\n\n.welcome-card {\n  background: rgba(30, 41, 59, 0.7);\n  backdrop-filter: blur(16px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  padding: 2.5rem;\n  border-radius: 20px;\n  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);\n  max-width: 480px;\n  text-align: center;\n}\n\n.badge {\n  display: inline-block;\n  padding: 4px 12px;\n  background: rgba(99, 102, 241, 0.2);\n  color: #818cf8;\n  border: 1px solid rgba(99, 102, 241, 0.3);\n  border-radius: 999px;\n  font-size: 0.8rem;\n  font-weight: 600;\n  margin-bottom: 1rem;\n}\n\nh1 {\n  margin: 0 0 0.5rem 0;\n  font-size: 1.8rem;\n  letter-spacing: -0.02em;\n  background: linear-gradient(to right, #ffffff, #cbd5e1);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}\n\np {\n  color: #94a3b8;\n  line-height: 1.6;\n  margin-bottom: 1.8rem;\n}\n\n.actions {\n  display: flex;\n  gap: 12px;\n  justify-content: center;\n}\n\n.btn {\n  padding: 10px 20px;\n  border-radius: 10px;\n  border: none;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n\n.btn.primary {\n  background: #6366f1;\n  color: white;\n}\n.btn.primary:hover {\n  background: #4f46e5;\n  transform: translateY(-2px);\n}\n\n.btn.secondary {\n  background: rgba(255, 255, 255, 0.1);\n  color: #e2e8f0;\n}\n.btn.secondary:hover {\n  background: rgba(255, 255, 255, 0.2);\n  transform: translateY(-2px);\n}`,
          js: `// 简单前端逻辑\nlet count = 0;\nconst countSpan = document.getElementById('count');\nconst counterBtn = document.getElementById('counterBtn');\nconst particleBtn = document.getElementById('particleBtn');\n\ncounterBtn.addEventListener('click', () => {\n  count++;\n  countSpan.textContent = count;\n  counterBtn.style.transform = 'scale(0.95)';\n  setTimeout(() => counterBtn.style.transform = '', 100);\n});\n\nparticleBtn.addEventListener('click', () => {\n  // 创建漂浮粒子\n  for (let i = 0; i < 20; i++) {\n    const p = document.createElement('div');\n    p.textContent = ['🎉', '✨', '⚡️', '🚀', '💖'][Math.floor(Math.random() * 5)];\n    p.style.position = 'fixed';\n    p.style.left = Math.random() * 100 + 'vw';\n    p.style.top = '100vh';\n    p.style.fontSize = '24px';\n    p.style.pointerEvents = 'none';\n    p.style.transition = 'all 1.5s ease-out';\n    document.body.appendChild(p);\n    \n    requestAnimationFrame(() => {\n      p.style.transform = \`translateY(-\${Math.random() * 80 + 20}vh) rotate(\${Math.random() * 360}deg)\`;\n      p.style.opacity = '0';\n    });\n    \n    setTimeout(() => p.remove(), 1600);\n  }\n});\nconsole.log('HTMLShare demo script initialized successfully!');`,
          isPublic: true,
          expiresAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          views: 128,
          forksCount: 12,
          forkedFrom: null,
          tags: ["demo", "html5", "css3"],
        },
      ];
      await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
      return initialData;
    }
    const raw = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Storage initialization error:", err);
    return [];
  }
}

async function loadSnippets(): Promise<StoredSnippet[]> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf-8");
    const list: StoredSnippet[] = JSON.parse(raw);
    const now = new Date();
    // Filter out expired items
    const valid = list.filter((item) => {
      if (!item.expiresAt) return true;
      return new Date(item.expiresAt) > now;
    });
    return valid;
  } catch {
    return [];
  }
}

async function saveSnippets(snippets: StoredSnippet[]): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(snippets, null, 2), "utf-8");
}

function sanitizeSnippet(snippet: StoredSnippet, providedPasscode?: string) {
  const { passcode, ...rest } = snippet;
  const isProtected = !!passcode;
  const isUnlocked = !isProtected || (providedPasscode && providedPasscode === passcode);

  return {
    ...rest,
    hasPasscode: isProtected,
    // Mask code content if passcode protected and not unlocked
    html: isUnlocked ? snippet.html : "<!-- 🔒 该代码片段受密码保护，请输入密码后查看 -->",
    css: isUnlocked ? snippet.css : "/* 🔒 Password Protected */",
    js: isUnlocked ? snippet.js : "// 🔒 Password Protected",
  };
}

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
  // GitHub blob link: https://github.com/user/repo/blob/main/path/to/file.html
  // -> https://raw.githubusercontent.com/user/repo/main/path/to/file.html
  if (url.includes("github.com/") && url.includes("/blob/")) {
    url = url.replace("github.com/", "raw.githubusercontent.com/").replace("/blob/", "/");
  }
  // Bitbucket src link: https://bitbucket.org/user/repo/src/branch/path.html
  // -> https://bitbucket.org/user/repo/raw/branch/path.html
  if (url.includes("bitbucket.org/") && url.includes("/src/")) {
    url = url.replace("/src/", "/raw/");
  }
  // GitLab blob link: https://gitlab.com/user/repo/-/blob/branch/path.html
  // -> https://gitlab.com/user/repo/-/raw/branch/path.html
  if (url.includes("gitlab.com/") && url.includes("/-/blob/")) {
    url = url.replace("/-/blob/", "/-/raw/");
  }
  return url;
}

function buildFullHtml(html: string, css: string, js: string, title = "Hosted Page"): string {
  const rawHtml = (html || "").trim();
  const rawCss = (css || "").trim();
  const rawJs = (js || "").trim();
  const isFullDoc = /<!DOCTYPE\s+html/i.test(rawHtml) || /<html[\s>]/i.test(rawHtml);

  if (isFullDoc) {
    let result = rawHtml;
    if (rawCss) {
      const styleTag = `<style>\n${rawCss}\n</style>`;
      if (/<\/head>/i.test(result)) {
        result = result.replace(/<\/head>/i, `${styleTag}\n</head>`);
      } else if (/<body[\s>]/i.test(result)) {
        result = result.replace(/<body([^>]*)>/i, `<body$1>\n${styleTag}`);
      } else {
        result = `${styleTag}\n${result}`;
      }
    }
    if (rawJs) {
      const scriptTag = `<script>\n${rawJs}\n</script>`;
      if (/<\/body>/i.test(result)) {
        result = result.replace(/<\/body>/i, `${scriptTag}\n</body>`);
      } else {
        result = `${result}\n${scriptTag}`;
      }
    }
    return result;
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${title}</title>
  ${rawCss ? `<style>\n${rawCss}\n</style>` : ""}
</head>
<body>
${rawHtml}
${rawJs ? `  <script>\n${rawJs}\n  </script>` : ""}
</body>
</html>`;
}

async function startServer() {
  await initStorage();
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // --- API ROUTES ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "HTMLShare Platform" });
  });

  // Get list of public snippets (Cloudflare D1 query emulation)
  app.get("/api/snippets", async (req, res) => {
    try {
      const snippets = await loadSnippets();
      const q = (req.query.q as string || "").toLowerCase();
      const tag = req.query.tag as string;

      let filtered = snippets.filter((s) => s.isPublic);

      if (q) {
        filtered = filtered.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.slug.toLowerCase().includes(q)
        );
      }

      if (tag) {
        filtered = filtered.filter((s) => s.tags?.includes(tag));
      }

      // Sort by newest
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Sanitize output
      const result = filtered.map((item) => sanitizeSnippet(item));
      res.json({ success: true, count: result.length, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get single snippet by ID or custom slug
  app.get("/api/snippets/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      const passcode = (req.headers["x-snippet-passcode"] as string) || (req.query.passcode as string);

      const snippets = await loadSnippets();
      const found = snippets.find((s) => s.id === idOrSlug || s.slug === idOrSlug);

      if (!found) {
        return res.status(404).json({ success: false, error: "Snippet not found or expired" });
      }

      // Increment view counter
      found.views = (found.views || 0) + 1;
      await saveSnippets(snippets);

      const sanitized = sanitizeSnippet(found, passcode);
      res.json({ success: true, data: sanitized });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Verify passcode for protected snippet
  app.post("/api/snippets/:idOrSlug/verify", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      const { passcode } = req.body;

      const snippets = await loadSnippets();
      const found = snippets.find((s) => s.id === idOrSlug || s.slug === idOrSlug);

      if (!found) {
        return res.status(404).json({ success: false, error: "Snippet not found" });
      }

      if (!found.passcode || found.passcode === passcode) {
        return res.json({ success: true, valid: true, data: sanitizeSnippet(found, passcode) });
      }

      res.status(401).json({ success: false, valid: false, error: "密码错误，无法查看该代码片段" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Create or update snippet (Cloudflare KV + D1 persist)
  app.post("/api/snippets", async (req, res) => {
    try {
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
        expiresInHours, // null, 1, 24, 168 (7d), 720 (30d)
        tags = [],
      } = req.body;

      if (!html && !css && !js) {
        return res.status(400).json({ success: false, error: "代码内容不能为空" });
      }

      const snippets = await loadSnippets();

      let slug = (requestedSlug || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!slug) {
        slug = generateRandomSlug(6);
      }

      // Check slug collision if creating new or changing slug
      const existingSlugIndex = snippets.findIndex((s) => s.slug === slug);
      if (existingSlugIndex !== -1 && (!id || snippets[existingSlugIndex].id !== id)) {
        // Append random suffix if custom slug taken
        slug = `${slug}-${generateRandomSlug(3)}`;
      }

      let expiresAt: string | null = null;
      if (expiresInHours && typeof expiresInHours === "number") {
        const d = new Date();
        d.setHours(d.getHours() + expiresInHours);
        expiresAt = d.toISOString();
      }

      const snippetId = id || `snp_${generateRandomSlug(8)}`;
      const existingIndex = snippets.findIndex((s) => s.id === snippetId || (slug && s.slug === slug));

      // 防重复写入检测 (Idempotent Check)
      if (existingIndex !== -1) {
        const existing = snippets[existingIndex];
        const isMatch =
          existing.html === (html !== undefined ? html : existing.html) &&
          existing.css === (css !== undefined ? css : existing.css) &&
          existing.js === (js !== undefined ? js : existing.js) &&
          existing.title === (title || existing.title) &&
          existing.description === (description !== undefined ? description : existing.description) &&
          existing.isPublic === (isPublic !== undefined ? isPublic : existing.isPublic) &&
          (existing.passcode || undefined) === (passcode || undefined);

        if (isMatch) {
          return res.json({
            success: true,
            message: "数据未改变，直接复用已有记录（无重复写入）",
            data: sanitizeSnippet(existing, passcode),
            shareUrl: `/s/${existing.slug}`,
            rawUrl: `/raw/${existing.slug}`,
          });
        }
      }

      const now = new Date().toISOString();

      if (existingIndex !== -1) {
        // Update
        snippets[existingIndex] = {
          ...snippets[existingIndex],
          title: title || snippets[existingIndex].title,
          description: description !== undefined ? description : snippets[existingIndex].description,
          html: html !== undefined ? html : snippets[existingIndex].html,
          css: css !== undefined ? css : snippets[existingIndex].css,
          js: js !== undefined ? js : snippets[existingIndex].js,
          isPublic: isPublic !== undefined ? isPublic : snippets[existingIndex].isPublic,
          passcode: passcode !== undefined ? passcode : snippets[existingIndex].passcode,
          expiresAt: expiresAt !== undefined ? expiresAt : snippets[existingIndex].expiresAt,
          updatedAt: now,
          tags: tags || snippets[existingIndex].tags,
        };
      } else {
        // Create
        const newSnippet: StoredSnippet = {
          id: snippetId,
          slug,
          title: title || "未命名 HTML 片段",
          description: description || "",
          html: html || "",
          css: css || "",
          js: js || "",
          isPublic,
          passcode: passcode || undefined,
          expiresAt,
          createdAt: now,
          updatedAt: now,
          views: 0,
          forksCount: 0,
          forkedFrom: null,
          tags: Array.isArray(tags) ? tags : [],
        };
        snippets.push(newSnippet);
      }

      await saveSnippets(snippets);
      const savedItem = snippets.find((s) => s.id === snippetId || s.slug === slug)!;

      res.json({
        success: true,
        data: sanitizeSnippet(savedItem, passcode),
        shareUrl: `/s/${savedItem.slug}`,
        rawUrl: `/raw/${savedItem.slug}`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Fork a snippet
  app.post("/api/snippets/:idOrSlug/fork", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      const passcode = req.body.passcode || req.headers["x-snippet-passcode"];

      const snippets = await loadSnippets();
      const parent = snippets.find((s) => s.id === idOrSlug || s.slug === idOrSlug);

      if (!parent) {
        return res.status(404).json({ success: false, error: "原片段不存在或已过期" });
      }

      if (parent.passcode && parent.passcode !== passcode) {
        return res.status(401).json({ success: false, error: "密码验证失败，无法 Fork 该片段" });
      }

      // Increment parent fork counter
      parent.forksCount = (parent.forksCount || 0) + 1;

      const newId = `snp_${generateRandomSlug(8)}`;
      const newSlug = `${parent.slug}-fork-${generateRandomSlug(3)}`;
      const now = new Date().toISOString();

      const forkedSnippet: StoredSnippet = {
        id: newId,
        slug: newSlug,
        title: `Fork of ${parent.title}`,
        description: `Forked from ${parent.slug}`,
        html: parent.html,
        css: parent.css,
        js: parent.js,
        isPublic: true,
        expiresAt: null,
        createdAt: now,
        updatedAt: now,
        views: 0,
        forksCount: 0,
        forkedFrom: parent.slug,
        tags: [...(parent.tags || []), "fork"],
      };

      snippets.push(forkedSnippet);
      await saveSnippets(snippets);

      res.json({
        success: true,
        data: sanitizeSnippet(forkedSnippet),
        shareUrl: `/s/${forkedSnippet.slug}`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete snippet
  app.delete("/api/snippets/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      const passcode = req.body?.passcode || req.headers["x-snippet-passcode"];

      let snippets = await loadSnippets();
      const found = snippets.find((s) => s.id === idOrSlug || s.slug === idOrSlug);

      if (!found) {
        return res.status(404).json({ success: false, error: "Snippet not found" });
      }

      if (found.passcode && found.passcode !== passcode) {
        return res.status(401).json({ success: false, error: "密码错误，无法删除" });
      }

      snippets = snippets.filter((s) => s.id !== found.id);
      await saveSnippets(snippets);

      res.json({ success: true, message: "删除成功" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- ADMIN & DATA MANAGEMENT ENDPOINTS ---
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";
  const ADMIN_TOKEN_KEY = "htmlshare_token_" + Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString("base64");

  const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = (req.headers["authorization"] as string) || (req.headers["x-admin-token"] as string);
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, "").trim() : null;
    if (!token || token !== ADMIN_TOKEN_KEY) {
      return res.status(401).json({ success: false, error: "未授权或管理员登录已过期，请重新登录" });
    }
    next();
  };

  // Admin Login Endpoint (username / password validation)
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res.status(400).json({ success: false, error: "请输入管理员账号与密码" });
      }

      if (username.trim() === ADMIN_USERNAME && String(password).trim() === ADMIN_PASSWORD) {
        return res.json({
          success: true,
          token: ADMIN_TOKEN_KEY,
          username: ADMIN_USERNAME,
          message: "管理员登录成功",
        });
      }

      return res.status(401).json({ success: false, error: "管理员账号或密码错误" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin Verify Token Session
  app.get("/api/admin/verify", requireAdminAuth, (req, res) => {
    res.json({ success: true, username: ADMIN_USERNAME });
  });

  // Admin stats overview
  app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
    try {
      const snippets = await loadSnippets();
      const now = new Date();

      let totalViews = 0;
      let totalForks = 0;
      let protectedCount = 0;
      let publicCount = 0;
      let privateCount = 0;
      let totalCharacters = 0;

      for (const s of snippets) {
        totalViews += s.views || 0;
        totalForks += s.forksCount || 0;
        if (s.passcode) protectedCount++;
        if (s.isPublic) publicCount++;
        else privateCount++;
        totalCharacters += (s.html?.length || 0) + (s.css?.length || 0) + (s.js?.length || 0);
      }

      res.json({
        success: true,
        stats: {
          totalCount: snippets.length,
          totalViews,
          totalForks,
          protectedCount,
          publicCount,
          privateCount,
          approxSizeKb: Math.round((totalCharacters * 2) / 1024),
          storageEngine: "Cloudflare D1 & KV (Emulated)",
          lastSynced: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin list all snippets with management metadata
  app.get("/api/admin/snippets", requireAdminAuth, async (req, res) => {
    try {
      const snippets = await loadSnippets();
      const list = snippets.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        description: s.description,
        isPublic: s.isPublic,
        hasPasscode: !!s.passcode,
        passcode: s.passcode || "",
        expiresAt: s.expiresAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        views: s.views || 0,
        forksCount: s.forksCount || 0,
        tags: s.tags || [],
        htmlLength: s.html?.length || 0,
        cssLength: s.css?.length || 0,
        jsLength: s.js?.length || 0,
        totalSizeKb: (((s.html?.length || 0) + (s.css?.length || 0) + (s.js?.length || 0)) / 1024).toFixed(1),
      }));

      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({ success: true, count: list.length, data: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin update snippet metadata (title, slug, tags, passcode, isPublic, description)
  app.put("/api/admin/snippets/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, slug, isPublic, passcode, tags, expiresAt } = req.body;

      const snippets = await loadSnippets();
      const index = snippets.findIndex((s) => s.id === id);

      if (index === -1) {
        return res.status(404).json({ success: false, error: "未找到该片段记录" });
      }

      // If slug was changed, check uniqueness
      if (slug && slug !== snippets[index].slug) {
        const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
        const slugCollision = snippets.some((s) => s.slug === cleanSlug && s.id !== id);
        if (slugCollision) {
          return res.status(400).json({ success: false, error: "自定义短链已存在，请使用其他名称" });
        }
        snippets[index].slug = cleanSlug;
      }

      if (title !== undefined) snippets[index].title = title.trim();
      if (description !== undefined) snippets[index].description = description.trim();
      if (isPublic !== undefined) snippets[index].isPublic = !!isPublic;
      if (passcode !== undefined) snippets[index].passcode = passcode ? passcode.trim() : undefined;
      if (tags !== undefined && Array.isArray(tags)) snippets[index].tags = tags;
      if (expiresAt !== undefined) snippets[index].expiresAt = expiresAt;
      snippets[index].updatedAt = new Date().toISOString();

      await saveSnippets(snippets);

      res.json({
        success: true,
        message: "更新片段数据成功",
        data: sanitizeSnippet(snippets[index]),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Admin force delete snippet
  app.delete("/api/admin/snippets/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      let snippets = await loadSnippets();
      const beforeCount = snippets.length;
      snippets = snippets.filter((s) => s.id !== id && s.slug !== id);

      if (snippets.length === beforeCount) {
        return res.status(404).json({ success: false, error: "片段不存在" });
      }

      await saveSnippets(snippets);
      res.json({ success: true, message: "片段已从后台数据库彻底清除" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Clean all expired snippets
  app.post("/api/admin/snippets/clean-expired", requireAdminAuth, async (req, res) => {
    try {
      let snippets = await loadSnippets();
      const now = new Date();
      const initialCount = snippets.length;
      snippets = snippets.filter((item) => {
        if (!item.expiresAt) return true;
        return new Date(item.expiresAt) > now;
      });
      const removedCount = initialCount - snippets.length;
      await saveSnippets(snippets);
      res.json({ success: true, message: `已成功清理 ${removedCount} 个过期片段`, removedCount });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Export full JSON database
  app.get("/api/admin/export", requireAdminAuth, async (req, res) => {
    try {
      const snippets = await loadSnippets();
      const exportJson = JSON.stringify(snippets, null, 2);
      res.setHeader("Content-Disposition", `attachment; filename=htmlshare_backup_${Date.now()}.json`);
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.send(exportJson);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Import snippets into database
  app.post("/api/admin/import", requireAdminAuth, async (req, res) => {
    try {
      const { data, mode = "merge" } = req.body; // 'merge' or 'replace'
      if (!Array.isArray(data)) {
        return res.status(400).json({ success: false, error: "导入的数据必须是片段数组" });
      }

      let current = mode === "replace" ? [] : await loadSnippets();
      let importedCount = 0;

      for (const item of data) {
        if (!item.id || !item.slug) continue;
        const existingIndex = current.findIndex((s) => s.id === item.id || s.slug === item.slug);
        if (existingIndex !== -1) {
          if (mode === "merge") {
            current[existingIndex] = { ...current[existingIndex], ...item, updatedAt: new Date().toISOString() };
          }
        } else {
          current.push({
            ...item,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
        importedCount++;
      }

      await saveSnippets(current);
      res.json({ success: true, message: `成功导入 ${importedCount} 条代码片段记录`, total: current.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Direct RAW HTML endpoint for instant browser execution & embedding
  app.get("/raw/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      const passcode = req.query.passcode as string;

      const snippets = await loadSnippets();
      const found = snippets.find((s) => s.id === idOrSlug || s.slug === idOrSlug);

      if (!found) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <body style="font-family: sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; background:#090d16; color:#94a3b8; text-align:center;">
            <div>
              <h1 style="color:#f8fafc; font-size:2rem; margin-bottom:8px;">404 - 代码片段不存在</h1>
              <p>该短链可能已被作者删除或设置了到期时间。</p>
            </div>
          </body>
          </html>
        `);
      }

      if (found.passcode && found.passcode !== passcode) {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        return res.status(401).send(`
          <!DOCTYPE html>
          <html>
          <body style="font-family: sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; background:#0f172a; color:#f8fafc; text-align:center; margin:0;">
            <div style="background:#1e293b; padding:32px; border-radius:16px; border:1px solid #334155; max-width:360px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
              <h2 style="margin-top:0;">🔒 密码锁定</h2>
              <p style="color:#94a3b8; font-size:14px;">此 HTML 页面设置了访问密码，请在 URL 后附加 ?passcode=您的密码 查看。</p>
            </div>
          </body>
          </html>
        `);
      }

      // Increment view
      found.views = (found.views || 0) + 1;
      await saveSnippets(snippets);

      const fullPage = buildFullHtml(found.html, found.css, found.js, found.title);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(fullPage);
    } catch (err: any) {
      res.status(500).send(`Server Error: ${err.message}`);
    }
  });

  // Short path '/p/:code' for Eternity and raw hosted links
  app.get("/p/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const passcode = req.query.passcode as string;
      const snippets = await loadSnippets();
      const found = snippets.find((s) => s.id === code || s.slug === code);

      if (!found) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html><head><meta charset="utf-8"><title>404 - 链接未找到</title></head>
          <body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#090d16;color:#f8fafc;margin:0;">
            <div style="text-align:center;">
              <h1 style="font-size:3rem;margin-bottom:8px;">404</h1>
              <p style="color:#94a3b8;">该永久链接不存在或已被创建者移除。</p>
              <a href="/" style="color:#818cf8;text-decoration:none;">返回 HTMLShare 首页</a>
            </div>
          </body></html>
        `);
      }

      if (found.passcode && found.passcode !== passcode) {
        return res.status(401).send("Password protected");
      }

      found.views = (found.views || 0) + 1;
      await saveSnippets(snippets);

      const fullPage = buildFullHtml(found.html, found.css, found.js, found.title);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(fullPage);
    } catch (err: any) {
      res.status(500).send(`Server Error: ${err.message}`);
    }
  });

  // Compatible POST /generate endpoint (inspired by wasmer HTML renderer)
  app.post("/generate", async (req, res) => {
    try {
      const { type, url, code } = req.body || {};
      let htmlContent = "";
      let title = "♡｡Sky.✨ 永久页面";

      if (type === "url") {
        if (!url) {
          return res.status(400).json({ success: false, error: "请输入有效的代码链接" });
        }
        const normalizedUrl = normalizeRawUrl(url);
        const resp = await fetch(normalizedUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) HTMLShare/1.0",
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
          return res.status(400).json({ success: false, error: "请粘贴 HTML 代码" });
        }
        htmlContent = code;
        const titleMatch = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) title = titleMatch[1].trim();
      } else {
        return res.status(400).json({ success: false, error: "无效的生成请求类型" });
      }

      const snippets = await loadSnippets();
      const slug = generateRandomSlug(6);
      const newId = `snp_${generateRandomSlug(8)}`;
      const now = new Date().toISOString();

      const newSnippet: StoredSnippet = {
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
        forkedFrom: null,
        tags: ["sky-renderer", type || "quick"],
      };

      snippets.push(newSnippet);
      await saveSnippets(snippets);

      res.json({
        success: true,
        code: slug,
        slug,
        url: `/p/${slug}`,
        rawUrl: `/raw/${slug}`,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Fetch remote URL content (proxies requests to bypass browser CORS for GitHub, Bitbucket, GitLab, etc.)
  app.post("/api/fetch-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ success: false, error: "请输入有效的代码链接" });
      }

      const normalizedUrl = normalizeRawUrl(url);
      const resp = await fetch(normalizedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 HTMLShare/1.0",
          "Accept": "text/html,application/xhtml+xml,application/xml,text/plain,*/*",
        },
      });

      if (!resp.ok) {
        throw new Error(`远程服务器返回 HTTP ${resp.status} (${resp.statusText})`);
      }

      const content = await resp.text();
      let extractedTitle = "";
      const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (titleMatch) {
        extractedTitle = titleMatch[1].trim();
      }
      const filename = url.split("/").pop()?.split("?")[0] || "index.html";

      res.json({
        success: true,
        content,
        normalizedUrl,
        size: content.length,
        title: extractedTitle || filename,
        filename,
      });
    } catch (err: any) {
      console.error("Fetch URL error:", err);
      res.status(500).json({ success: false, error: err.message || "无法拉取远程内容" });
    }
  });

  // Direct generation API for Eternity and external integration
  app.post("/generate", async (req, res) => {
    try {
      const { type, url, code } = req.body;
      let snippetHtml = "";
      let snippetTitle = "✨ Eternity 永久托管页面";

      if (type === "url") {
        if (!url) return res.status(400).json({ success: false, error: "请输入有效的 URL" });
        const normalized = normalizeRawUrl(url);
        const fetchResp = await fetch(normalized, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; HTMLShare/1.0)",
            "Accept": "text/html,text/plain,*/*",
          },
        });
        if (!fetchResp.ok) throw new Error(`无法从远程 URL 获取内容: HTTP ${fetchResp.status}`);
        snippetHtml = await fetchResp.text();
        const titleMatch = snippetHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        snippetTitle = titleMatch ? titleMatch[1].trim() : `URL: ${url.split("/").pop() || "托管页面"}`;
      } else if (type === "code") {
        if (!code) return res.status(400).json({ success: false, error: "代码不能为空" });
        snippetHtml = code;
        const titleMatch = snippetHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          snippetTitle = titleMatch[1].trim();
        }
      } else {
        return res.status(400).json({ success: false, error: "无效的生成类型" });
      }

      const slug = generateRandomSlug(6);
      const newSnippet: StoredSnippet = {
        id: `snp_${generateRandomSlug(8)}`,
        slug,
        title: snippetTitle,
        description: "由 Eternity 永久链接服务托管创建",
        html: snippetHtml,
        css: "",
        js: "",
        isPublic: true,
        expiresAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: 1,
        forksCount: 0,
        forkedFrom: "eternity-demo",
        tags: ["eternity", "hosted"],
      };

      const snippets = await loadSnippets();
      snippets.unshift(newSnippet);
      await saveSnippets(snippets);

      res.json({ success: true, code: slug });
    } catch (err: any) {
      console.error("Eternity /generate Error:", err);
      res.status(500).json({ success: false, error: err.message || "生成失败" });
    }
  });

  // Embed mode
  app.get("/embed/:idOrSlug", async (req, res) => {
    try {
      const { idOrSlug } = req.params;
      const passcode = req.query.passcode as string;

      const snippets = await loadSnippets();
      const found = snippets.find((s) => s.id === idOrSlug || s.slug === idOrSlug);

      if (!found) {
        return res.status(404).send("Snippet not found");
      }

      if (found.passcode && found.passcode !== passcode) {
        return res.status(401).send("Password protected");
      }

      const fullHtml = buildFullHtml(found.html, found.css, found.js, found.title);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(fullHtml);
    } catch (err: any) {
      res.status(500).send("Server Error");
    }
  });

  // Gemini & OpenAI/DeepSeek compatible AI endpoint for generating or optimizing code
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const {
        prompt = "",
        currentHtml = "",
        currentCss = "",
        currentJs = "",
        actionType = "generate",
        customProvider,
      } = req.body;

      if (!prompt && actionType === "generate") {
        return res.status(400).json({ success: false, error: "请输入需求描述" });
      }

      let systemInstruction = `你是一个顶级的前端开发工程师、架构师和 UI 设计专家。
请根据用户的提示，输出可直接运行的 HTML、CSS 和 JavaScript 代码。
代码风格要求：视觉高质感、现代美观、响应式布局、高对比度与优质的内边距，带有极佳的细节处理。

你必须严格输出合法的 JSON 格式，包含以下字段：
1. "title": "简短醒目的页面标题",
2. "html": "HTML 标签代码（不需要 <html><head><body> 包装，直接提供内容）",
3. "css": "CSS 样式代码",
4. "js": "JavaScript 脚本代码",
5. "explanation": "对所编写或优化功能的简要中文解释",
6. "performanceScore": 95 (0-100间的整数健康评分),
7. "suggestions": ["优化建议1", "优化建议2", "优化建议3"],
8. "performanceAnalysis": {
     "html": "HTML 结构与语义化分析",
     "css": "CSS 渲染与层叠性能分析",
     "js": "JS 执行效率与事件管理分析"
   }`;

      let userPrompt = prompt;
      if (actionType === "optimize") {
        userPrompt = `请对以下现有的前端 HTML/CSS/JS 代码进行全方位的【代码优化、格式化、性能分析与重构建议】：
1. 规范化代码缩进与排版，提升代码可读性与现代语法特性。
2. 深度性能分析（DOM 深度、关键渲染路径、重排重绘隐患、内存泄漏与事件解绑、异步处理）。
3. 结构重构（语义化标签、现代 CSS Flex/Grid 与动画性能、简洁健壮的 JS 逻辑）。

【当前 HTML】:
${currentHtml || "<!-- 空 HTML -->"}

【当前 CSS】:
${currentCss || "/* 空 CSS */"}

【当前 JS】:
${currentJs || "// 空 JS"}

用户重点优化需求: ${prompt || "全面排版美化、性能分析与重构升级"}`;
      } else if (actionType === "fix") {
        userPrompt = `请检查并修复以下前端代码中的 BUG 和逻辑缺陷：
【当前 HTML】:
${currentHtml}

【当前 CSS】:
${currentCss}

【当前 JS】:
${currentJs}

用户补充说明: ${prompt || "自动修复语法与报错，优化运行稳定性"}`;
      } else if (actionType === "enhance") {
        userPrompt = `请大幅美化与升级以下代码的 UI 视觉风格与交互体验：
【当前 HTML】:
${currentHtml}

【当前 CSS】:
${currentCss}

【当前 JS】:
${currentJs}

用户补充需求: ${prompt || "增加现代化深色/亮色微光效果、平滑动画与响应式设计"}`;
      }

      let textOutput = "";

      // Check if user specified custom DeepSeek / OpenAI compatible API
      if (customProvider && customProvider.apiKey && customProvider.apiKey.trim()) {
        const baseUrl = (customProvider.baseUrl || "https://api.deepseek.com/v1").replace(/\/+$/, "");
        const model = customProvider.model || "deepseek-chat";
        
        const openAiResp = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customProvider.apiKey.trim()}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
          }),
        });

        if (!openAiResp.ok) {
          const errText = await openAiResp.text();
          throw new Error(`OpenAI/DeepSeek API 响应错误 [${openAiResp.status}]: ${errText}`);
        }

        const openAiData = await openAiResp.json();
        textOutput = openAiData.choices?.[0]?.message?.content || "";
      } else {
        // Use Gemini API
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return res.status(500).json({
            success: false,
            error: "未配置 GEMINI_API_KEY，您也可以在弹窗中填入 DeepSeek/OpenAI 兼容 API Key 继续使用。",
          });
        }

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        });

        textOutput = response.text || "";
      }

      let parsed = {
        title: "优化后的代码片段",
        html: currentHtml,
        css: currentCss,
        js: currentJs,
        explanation: "优化分析完成！",
        performanceScore: 92,
        suggestions: [
          "规范了 HTML 标签语义化与可访问性标记",
          "优化了 CSS 属性排列与过渡动画渲染性能",
          "增强了 JavaScript 事件委托与健壮性检查",
        ],
        performanceAnalysis: {
          html: "结构清晰，无多余冗余嵌套，可访问性良好。",
          css: "避免了高消耗的选择器和全屏强制重绘，平滑动画表现优异。",
          js: "执行逻辑精炼，无全局污染，事件监听安全挂载。",
        },
      };

      try {
        const cleanJson = textOutput.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
        const rawParsed = JSON.parse(cleanJson);
        parsed = {
          ...parsed,
          ...rawParsed,
        };
      } catch {
        if (textOutput) {
          parsed.explanation = textOutput;
        }
      }

      res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error("AI API Error:", err);
      res.status(500).json({ success: false, error: err.message || "AI 处理失败，请稍后重试" });
    }
  });

  // Cloudflare Export Config Endpoint (Provides D1 Schema SQL & Worker JS for Users)
  app.get("/api/cloudflare/export", (req, res) => {
    const schemaSql = `-- Cloudflare D1 Database Schema for HTMLShare
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
CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets(created_at DESC);`;

    const wranglerJson = `{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "htmlshare-worker",
  "main": "src/index.js",
  "compatibility_date": "2026-09-01",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "htmlshare_d1",
      "database_id": "<YOUR_CLOUDFLARE_D1_DATABASE_ID>"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "KV_SNIPPETS",
      "id": "<YOUR_CLOUDFLARE_KV_NAMESPACE_ID>"
    }
  ]
}`;

    const workerCode = `// Cloudflare Worker / Pages Function API for HTMLShare
// 包含: D1 关系型存储 + KV 全球边缘渲染缓存 + 完整 RESTful API
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // CORS 响应头配置
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Snippet-Passcode",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const jsonResponse = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });

    try {
      // 1. 极速渲染页面: /raw/:slug (优先走 KV 边缘极速缓存)
      if (pathname.startsWith("/raw/") || pathname.startsWith("/embed/")) {
        const isEmbed = pathname.startsWith("/embed/");
        const slug = pathname.replace(isEmbed ? "/embed/" : "/raw/", "");
        const inputPasscode = searchParams.get("passcode") || request.headers.get("X-Snippet-Passcode") || "";

        // 优先尝试从 KV 缓存获取已编译好的 HTML (针对公开且免密代码)
        const cacheKey = \`html:\${slug}\`;
        let cached = await env.KV_SNIPPETS.get(cacheKey);

        // 如果未命中缓存或有密码要求，查 D1 数据库
        const snippet = await env.DB.prepare("SELECT * FROM snippets WHERE slug = ? OR id = ?")
          .bind(slug, slug)
          .first();

        if (!snippet) {
          return new Response("404 - Snippet Not Found (代码片段不存在或已过期)", {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
          });
        }

        // 检查访问密码
        if (snippet.passcode && snippet.passcode.trim() && snippet.passcode !== inputPasscode) {
          return new Response("401 - Protected Snippet (该页面受密码保护，请输入密码访问)", {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
          });
        }

        // 异步递增浏览量 (不阻塞页面返回)
        ctx.waitUntil(
          env.DB.prepare("UPDATE snippets SET views = views + 1 WHERE id = ?")
            .bind(snippet.id)
            .run()
        );

        let fullHtml = cached;
        if (!fullHtml) {
          fullHtml = \`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>\${snippet.title || 'HTMLShare 代码预览'}</title>
  <style>
    \${snippet.css || ''}
  </style>
</head>
<body>
  \${snippet.html || ''}
  <script>
    \${snippet.js || ''}
  <\/script>
</body>
</html>\`;

          // 如果无密码保护，存入 KV 缓存 1 小时
          if (!snippet.passcode) {
            ctx.waitUntil(env.KV_SNIPPETS.put(cacheKey, fullHtml, { expirationTtl: 3600 }));
          }
        }

        return new Response(fullHtml, {
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
        });
      }

      // 2. 获取代码片段详情: GET /api/snippets/:idOrSlug
      if (pathname.startsWith("/api/snippets/") && request.method === "GET") {
        const idOrSlug = pathname.replace("/api/snippets/", "");
        const inputPasscode = searchParams.get("passcode") || request.headers.get("X-Snippet-Passcode") || "";

        const snippet = await env.DB.prepare("SELECT * FROM snippets WHERE slug = ? OR id = ?")
          .bind(idOrSlug, idOrSlug)
          .first();

        if (!snippet) {
          return jsonResponse({ success: false, error: "代码片段不存在" }, 404);
        }

        if (snippet.passcode && snippet.passcode.trim() && snippet.passcode !== inputPasscode) {
          return jsonResponse({ success: false, error: "密码错误，请验证后查看", requiresPasscode: true }, 401);
        }

        return jsonResponse({
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
        const body = await request.json();
        const id = crypto.randomUUID();
        const slug = body.slug?.trim() || Math.random().toString(36).substring(2, 8);
        const now = new Date().toISOString();

        // 检查 slug 是否已存在
        const existing = await env.DB.prepare("SELECT id FROM snippets WHERE slug = ?")
          .bind(slug)
          .first();
        if (existing) {
          return jsonResponse({ success: false, error: "该个性化短链接已被占用，请更换" }, 409);
        }

        await env.DB.prepare(\`
          INSERT INTO snippets (
            id, slug, title, description, html, css, js,
            is_public, passcode, expires_at, created_at, updated_at,
            views, forks_count, forked_from, tags
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
        \`).bind(
          id,
          slug,
          body.title || "未命名代码片段",
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

        return jsonResponse({
          success: true,
          data: {
            id,
            slug,
            url: \`\${url.origin}/raw/\${slug}\`,
          },
        });
      }

      // 4. 广场公开列表: GET /api/explore
      if (pathname === "/api/explore" && request.method === "GET") {
        const { results } = await env.DB.prepare(
          "SELECT id, slug, title, description, created_at, views, forks_count, tags FROM snippets WHERE is_public = 1 ORDER BY created_at DESC LIMIT 50"
        ).all();

        return jsonResponse({
          success: true,
          data: results.map((r) => ({
            ...r,
            tags: r.tags ? JSON.parse(r.tags) : [],
          })),
        });
      }

      // 默认状态检查
      return jsonResponse({
        success: true,
        message: "HTMLShare Cloudflare Worker + D1 + KV Serverless API 运行正常",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }
};`;

    res.json({
      success: true,
      data: {
        schemaSql,
        wranglerJson,
        workerCode,
      },
    });
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`HTMLShare Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
