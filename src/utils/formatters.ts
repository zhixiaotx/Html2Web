/**
 * Basic HTML/CSS/JS code beautifier helpers
 */

export function formatHtml(html: string): string {
  if (!html) return '';
  let formatted = '';
  let reg = /(>)(<)(\/*)/g;
  let xml = html.replace(reg, '$1\r\n$2$3');
  let pad = 0;
  
  xml.split('\r\n').forEach((node) => {
    let indent = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (node.match(/^<\/\w/)) {
      if (pad !== 0) {
        pad -= 1;
      }
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }

    let padding = '';
    for (let i = 0; i < pad; i++) {
      padding += '  ';
    }

    formatted += padding + node + '\r\n';
    pad += indent;
  });

  return formatted.trim();
}

export function formatCss(css: string): string {
  if (!css) return '';
  return css
    .replace(/\s*\{\s*/g, ' {\n  ')
    .replace(/;\s*/g, ';\n  ')
    .replace(/\s*\}\s*/g, '\n}\n\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

export function formatJs(js: string): string {
  if (!js) return '';
  // Basic indent cleanup
  return js
    .replace(/;\s*/g, ';\n')
    .replace(/\{\s*/g, ' {\n  ')
    .replace(/\}\s*/g, '\n}\n')
    .trim();
}
