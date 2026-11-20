import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function readAdsIdFromEnvFiles() {
  const candidates = [
    ".env.production.local",
    ".env.local",
    ".env.production",
    ".env",
  ];

  for (const filename of candidates) {
    const fullPath = path.join(projectRoot, filename);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const match = line.match(/^NEXT_PUBLIC_ADSENSE_ID\s*=\s*(.*)$/);
      if (match) {
        const val = match[1].trim().replace(/^["']|["']$/g, "");
        if (val) return val;
      }
    }
  }
  return "";
}

function extractPubId(raw) {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  const pubMatch = trimmed.match(/(?:ca-)?(pub-\d{10,20})/i);
  if (pubMatch?.[1]) {
    return pubMatch[1].toLowerCase();
  }
  if (/^\d{10,20}$/.test(trimmed)) {
    return `pub-${trimmed}`;
  }
  return "";
}

const rawEnvId =
  process.env.NEXT_PUBLIC_ADSENSE_ID || readAdsIdFromEnvFiles();
const pubId = extractPubId(rawEnvId);
const publicDir = path.join(projectRoot, "public");
const adsTxtPath = path.join(publicDir, "ads.txt");

if (pubId) {
  fs.mkdirSync(publicDir, { recursive: true });
  const record = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;
  fs.writeFileSync(adsTxtPath, record, "utf8");
  console.log(`[ads.txt] Generated public/ads.txt for ${pubId}`);
} else {
  console.log("[ads.txt] NEXT_PUBLIC_ADSENSE_ID not set; skipping public/ads.txt generation.");
}
