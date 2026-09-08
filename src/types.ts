export interface Snippet {
  id: string;
  slug: string;
  title: string;
  description?: string;
  html: string;
  css: string;
  js: string;
  isPublic: boolean;
  passcode?: string; // Optional password lock
  hasPasscode?: boolean; // Sanitized flag for client
  expiresAt?: string | null; // ISO string or null for never
  createdAt: string;
  updatedAt: string;
  views: number;
  forksCount: number;
  forkedFrom?: string | null;
  tags?: string[];
}

export type ViewTab = 'html' | 'css' | 'js' | 'combined';

export type DeviceViewport = 'desktop' | 'tablet' | 'mobile';

export interface ConsoleLog {
  id: string;
  type: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface CloudflareConfigExport {
  schemaSql: string;
  wranglerJson: string;
  workerCode: string;
}

export type ThemeMode = 'dark' | 'light' | 'high-contrast';

export interface AIGenerateRequest {
  prompt: string;
  currentHtml?: string;
  currentCss?: string;
  currentJs?: string;
  actionType?: 'generate' | 'fix' | 'enhance' | 'optimize' | 'explain';
  customProvider?: {
    baseUrl?: string;
    apiKey?: string;
    model?: string;
  };
}

export interface AIGenerateResponse {
  html: string;
  css: string;
  js: string;
  title: string;
  explanation: string;
  performanceScore?: number;
  performanceAnalysis?: {
    html?: string;
    css?: string;
    js?: string;
    general?: string;
  };
  suggestions?: string[];
}

export interface AdminStats {
  totalCount: number;
  totalViews: number;
  totalForks: number;
  protectedCount: number;
  publicCount: number;
  privateCount: number;
  approxSizeKb: number;
  storageEngine: string;
  lastSynced: string;
}

export interface AdminSnippetItem extends Snippet {
  htmlLength?: number;
  cssLength?: number;
  jsLength?: number;
  totalSizeKb?: string;
}
