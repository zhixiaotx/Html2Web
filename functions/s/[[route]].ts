/**
 * Cloudflare Pages Functions - /s/* SPA 路由转发
 * 确保访问 /s/:slug 时由 Pages Assets 正常返回 index.html 供前端 React 客户端路由和加载代码
 */

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (env.ASSETS) {
    const assetUrl = new URL('/', request.url);
    return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
  }

  return new Response('Cloudflare Pages ASSETS binding not found', { status: 500 });
};
