import * as prettier from 'prettier/standalone';
import parserHtml from 'prettier/plugins/html';
import parserBabel from 'prettier/plugins/babel';
import parserEstree from 'prettier/plugins/estree';
import parserPostcss from 'prettier/plugins/postcss';
import { formatHtml as fallbackHtml, formatCss as fallbackCss, formatJs as fallbackJs } from './formatters';

export async function formatCode(
  code: string,
  language: 'html' | 'css' | 'js'
): Promise<{ formatted: string; error?: string }> {
  if (!code || !code.trim()) {
    return { formatted: code };
  }

  try {
    let result = '';
    if (language === 'html') {
      result = await prettier.format(code, {
        parser: 'html',
        plugins: [parserHtml],
        tabWidth: 2,
        useTabs: false,
        printWidth: 100,
        htmlWhitespaceSensitivity: 'css',
      });
    } else if (language === 'css') {
      result = await prettier.format(code, {
        parser: 'css',
        plugins: [parserPostcss],
        tabWidth: 2,
        useTabs: false,
        printWidth: 100,
      });
    } else if (language === 'js') {
      result = await prettier.format(code, {
        parser: 'babel',
        plugins: [parserBabel, parserEstree],
        tabWidth: 2,
        useTabs: false,
        printWidth: 100,
        semi: true,
        singleQuote: true,
      });
    }
    return { formatted: result.trimEnd() };
  } catch (err: any) {
    console.warn(`Prettier ${language} format error:`, err?.message || err);
    // Fallback gracefully to basic formatter so code is still structured without losing content
    let fallback = code;
    try {
      if (language === 'html') fallback = fallbackHtml(code);
      else if (language === 'css') fallback = fallbackCss(code);
      else if (language === 'js') fallback = fallbackJs(code);
    } catch {
      fallback = code;
    }
    return {
      formatted: fallback,
      error: `格式化提示: ${err?.message?.split('\n')[0] || '语法可能有未闭合标签，已使用基础排版优化'}`,
    };
  }
}
