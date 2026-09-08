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

  const isFullHtmlDocument = /<!DOCTYPE\s+html/i.test(rawHtml) || /<html[\s>]/i.test(rawHtml);

  // 控制台代理脚本（仅在编辑器内部 iframe 预览时注入）
  const consoleProxyScript = includeConsoleProxy
    ? `<script>
    (function() {
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

  // 1. 如果用户写的是完整 HTML5 页面结构（含 <!DOCTYPE html> / <html> / <head> / <body>）
  if (isFullHtmlDocument) {
    let result = rawHtml;

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

    // 注入控制台代理（如果有）
    if (consoleProxyScript) {
      if (/<head[\s>]/i.test(result)) {
        result = result.replace(/<head([^>]*)>/i, `<head$1>\n${consoleProxyScript}`);
      } else if (/<body[\s>]/i.test(result)) {
        result = result.replace(/<body([^>]*)>/i, `<body$1>\n${consoleProxyScript}`);
      } else {
        result = `${consoleProxyScript}\n${result}`;
      }
    }

    // 注入自定义 JS 逻辑
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

  // 2. 如果用户写的是片段（常规 HTML + CSS + JS），组装为符合标准语义的纯净 HTML5 页面
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <title>${title}</title>
  ${consoleProxyScript}
  ${rawCss ? `<style>\n${rawCss}\n</style>` : ''}
</head>
<body>
${rawHtml}
${rawJs ? `  <script>\n${rawJs}\n  </script>` : ''}
</body>
</html>`;
}
