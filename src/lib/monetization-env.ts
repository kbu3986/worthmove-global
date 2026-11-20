/**
 * Sanitizes monetization & verification environment variables.
 * Handles both raw IDs/tokens AND full pasted HTML snippets (<meta ...>, <iframe ...>, <script ...>).
 */

export function extractMetaContent(raw?: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const metaMatch = trimmed.match(/content\s*=\s*["']([^"']+)["']/i);
  if (metaMatch?.[1]) {
    return metaMatch[1].trim();
  }
  return trimmed.replace(/^["']|["']$/g, "").trim();
}

export function normalizeAdsenseClientId(raw?: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const pubMatch = trimmed.match(/(?:ca-)?pub-(\d{10,20})/i);
  if (pubMatch?.[1]) {
    return `ca-pub-${pubMatch[1]}`;
  }

  if (/^\d{14,20}$/.test(trimmed)) {
    return `ca-pub-${trimmed}`;
  }

  return "";
}

export function extractIframeSrc(raw?: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
  const candidate = srcMatch?.[1] ? srcMatch[1].trim() : trimmed;

  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }
  return "";
}

export function sanitizeHttpUrl(raw?: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return "";
}
