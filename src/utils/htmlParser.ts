export interface ParsedHtmlResult {
  html: string;
  css: string;
  js: string;
  title?: string;
}

/**
 * Intelligent HTML parser that can:
 * 1. Extract <title> for the snippet title
 * 2. Optionally split embedded <style> into CSS and <script> into JS
 * 3. Or preserve full HTML structure intact
 */
export function parseFullHtml(content: string, splitSubtags: boolean = true): ParsedHtmlResult {
  if (!content) {
    return { html: '', css: '', js: '', title: '' };
  }

  // Extract title if present
  let title = '';
  const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  if (!splitSubtags) {
    return {
      html: content,
      css: '',
      js: '',
      title,
    };
  }

  // Extract <style> contents
  let css = '';
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let styleMatch;
  while ((styleMatch = styleRegex.exec(content)) !== null) {
    const styleCode = styleMatch[1].trim();
    if (styleCode) {
      css += (css ? '\n\n' : '') + styleCode;
    }
  }

  // Extract <script> contents (ignore external scripts with src=)
  let js = '';
  const scriptRegex = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(content)) !== null) {
    const scriptCode = scriptMatch[1].trim();
    if (scriptCode) {
      js += (js ? '\n\n' : '') + scriptCode;
    }
  }

  // Remove extracted <style> and inline <script> tags from the HTML
  let cleanHtml = content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, '');

  // If there's a <body>...</body>, we can extract the inner body if appropriate
  const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1].trim()) {
    cleanHtml = bodyMatch[1].trim();
  } else {
    // If not, clean out doctype and html/head tags if they are empty
    cleanHtml = cleanHtml
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .trim();
  }

  return {
    html: cleanHtml.trim() || content.trim(),
    css: css.trim(),
    js: js.trim(),
    title,
  };
}
