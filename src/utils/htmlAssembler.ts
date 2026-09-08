/**
 * Unified HTML Assembler
 * 确保编辑器内预览、RAW 即时托管直出、单文件导出与真实浏览器渲染效果 100% 完全一致
 */

export interface AssembleOptions {
  title?: string;
  html?: string;
  css?: string;
  js?: string;
  includeConsoleProxy?: boolean;
}

export function assembleFullHtml(options: AssembleOptions): string {
  const {
    title = 'HTMLShare Page',
    html = '',
    css = '',
    js = '',
    includeConsoleProxy = false,
  } = options;

  const rawHtml = (html || '').trim();
  const rawCss = (css || '').trim();
  const rawJs = (js || '').trim();

  const isFullHtmlDocument =
    /<!DOCTYPE\s+html/i.test(rawHtml) ||
    /<html[\s>]/i.test(rawHtml) ||
    /<head[\s>]/i.test(rawHtml) ||
    /<body[\s>]/i.test(rawHtml);

  // 控制台代理 & 沙箱安全垫片（防止 iframe 中 pushState/alert 抛出 SecurityError 崩溃）
  const sandboxSafetyProxyScript = includeConsoleProxy
    ? `<script>
    (function() {
      // 1. 安全代理 history.pushState / history.replaceState，防止 iframe sandbox 抛出 SecurityError 导致全局脚本中断
      try {
        const _pushState = window.history.pushState;
        window.history.pushState = function(state, unused, url) {
          try {
            return _pushState.apply(window.history, arguments);
          } catch(e) {
            console.warn('[Sandbox Proxy] history.pushState 被沙箱安全拦截并已静默处理:', e.message);
          }
        };
        const _replaceState = window.history.replaceState;
        window.history.replaceState = function(state, unused, url) {
          try {
            return _replaceState.apply(window.history, arguments);
          } catch(e) {
            console.warn('[Sandbox Proxy] history.replaceState 被沙箱安全拦截并已静默处理:', e.message);
          }
        };
      } catch(e) {}

      // 2. 控制台日志桥接
      const _log = console.log;
      const _error = console.error;
      const _warn = console.warn;
      const _info = console.info;

      function sendLog(type, args) {
        try {
          const message = Array.from(args).map(arg => {
            if (typeof arg === 'object') {
              try { return JSON.stringify(arg); } catch(e) { return String(arg); }
            }
            return String(arg);
          }).join(' ');

          window.parent.postMessage({
            type: 'HTMLSHARE_CONSOLE_LOG',
            logType: type,
            message: message,
            timestamp: new Date().toLocaleTimeString()
          }, '*');
        } catch(e) {}
      }

      console.log = function() { sendLog('log', arguments); _log.apply(console, arguments); };
      console.error = function() { sendLog('error', arguments); _error.apply(console, arguments); };
      console.warn = function() { sendLog('warn', arguments); _warn.apply(console, arguments); };
      console.info = function() { sendLog('info', arguments); _info.apply(console, arguments); };

      window.onerror = function(msg, url, line, col, error) {
        sendLog('error', [\`Runtime Error: \${msg} (\${line}:\${col})\`]);
        return false;
      };
    })();
  </script>`
    : '';

  // 1. 如果用户输入的是完整 HTML5 页面结构（含 <!DOCTYPE html> / <html> / <head> / <body>）
  if (isFullHtmlDocument) {
    let result = rawHtml;

    // 确保有 <meta charset="UTF-8"> 与 viewport
    if (!/<meta[^>]*charset/i.test(result)) {
      if (/<head[\s>]/i.test(result)) {
        result = result.replace(/<head([^>]*)>/i, '<head$1>\n  <meta charset="UTF-8">');
      }
    }

    // 注入控制台代理与安全垫片（最先置于 <head> 或 <body> 开头）
    if (sandboxSafetyProxyScript) {
      if (/<head[\s>]/i.test(result)) {
        result = result.replace(/<head([^>]*)>/i, `<head$1>\n  ${sandboxSafetyProxyScript}`);
      } else if (/<body[\s>]/i.test(result)) {
        result = result.replace(/<body([^>]*)>/i, `<body$1>\n  ${sandboxSafetyProxyScript}`);
      } else {
        result = `${sandboxSafetyProxyScript}\n${result}`;
      }
    }

    // 注入自定义 CSS
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

    // 注入自定义 JS 逻辑（置于 </body> 闭合前）
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

  // 2. 如果用户写的是片段（常规 HTML + CSS + JS），检测是否需要加载 Tailwind CDN
  const usesTailwind =
    rawHtml.includes('class=') &&
    (rawHtml.includes('flex') ||
      rawHtml.includes('text-') ||
      rawHtml.includes('bg-') ||
      rawHtml.includes('rounded') ||
      rawHtml.includes('p-') ||
      rawHtml.includes('m-') ||
      rawHtml.includes('grid') ||
      rawHtml.includes('hidden') ||
      rawHtml.includes('dark:'));

  const tailwindScript = usesTailwind && !rawHtml.includes('tailwindcss.com')
    ? '  <script src="https://cdn.tailwindcss.com"></script>\n'
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${title}</title>
${sandboxSafetyProxyScript ? `  ${sandboxSafetyProxyScript}\n` : ''}${tailwindScript}${rawCss ? `  <style>\n${rawCss}\n  </style>\n` : ''}</head>
<body>
${rawHtml}
${rawJs ? `  <script>\n${rawJs}\n  </script>` : ''}
</body>
</html>`;
}
