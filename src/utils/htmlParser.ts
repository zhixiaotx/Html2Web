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
 * 3. Reliably preserve all <html class="...">, <body class="...">, external <script src="..."> and CDN links
 */
export function parseFullHtml(content: string, splitSubtags: boolean = true): ParsedHtmlResult {
  if (!content) {
    return { html: '', css: '', js: '', title: '' };
  }

  // 1. Extract title if present
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

  // 2. Extract <style> contents
  let css = '';
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let styleMatch;
  while ((styleMatch = styleRegex.exec(content)) !== null) {
    const styleCode = styleMatch[1].trim();
    if (styleCode) {
      css += (css ? '\n\n' : '') + styleCode;
    }
  }

  // 3. Extract inline <script> contents (ignore external scripts with src=, templates, and keep tailwind.config in head)
  let js = '';
  const scriptRegex = /<script(?![^>]*\bsrc=)(?![^>]*\btype=["'](?:application\/json|text\/template)["'])[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch;
  while ((scriptMatch = scriptRegex.exec(content)) !== null) {
    const scriptCode = scriptMatch[1].trim();
    // If it's a tailwind config script, preserve it in the HTML head so Tailwind CDN compiles custom colors immediately
    if (scriptCode.includes('tailwind.config') || scriptCode.includes('tailwind =')) {
      continue;
    }
    if (scriptCode) {
      js += (js ? '\n\n' : '') + scriptCode;
    }
  }

  // 4. Remove extracted <style> and inline <script> tags, but strictly PRESERVE:
  // - <!DOCTYPE html>
  // - <html ...> with its classes/attributes
  // - <head> with external scripts (<script src="...">), tailwind.config, stylesheets, fonts
  // - <body ...> with its classes/attributes
  let cleanHtml = content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script(?![^>]*\bsrc=)(?![^>]*\btype=["'](?:application\/json|text\/template)["'])[^>]*>([\s\S]*?)<\/script>/gi, (match, p1) => {
      if (p1 && (p1.includes('tailwind.config') || p1.includes('tailwind ='))) {
        return match; // preserve tailwind config in head
      }
      return '';
    })
    .trim();

  return {
    html: cleanHtml || content.trim(),
    css: css.trim(),
    js: js.trim(),
    title,
  };
}
