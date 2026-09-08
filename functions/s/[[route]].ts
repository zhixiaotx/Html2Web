/**
 * Cloudflare Pages Functions - /s/* SPA 路由转发
 * 确保访问 /s/:slug 时由 Pages Assets 正常返回 index.html 供前端 React 客户端路由和加载代码
 */

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (env.ASSETS) {
    const url = new URL(request.url);
    // 重定向内部请求至 / (即 index.html)，由浏览器 SPA 接管 /s/:slug 路由
    const assetUrl = new URL('/', request.url);
    const assetResponse = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    return new Response(assetResponse.body, {
      status: 200,
      headers: {
        ...Object.fromEntries(assetResponse.headers.entries()),
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }

  return new Response('Cloudflare Pages ASSETS binding not found', { status: 500 });
};
