import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appDir = join(root, "wego-erp-v1");
const hasNextAtRoot =
  existsSync(join(root, "next.config.ts")) ||
  existsSync(join(root, "next.config.js"));

if (hasNextAtRoot) {
  console.log("Building from wego-erp-v1 (Root Directory is correct).");
  process.exit(0);
}

if (!existsSync(join(appDir, "package.json"))) {
  console.error("wego-erp-v1 folder not found.");
  process.exit(1);
}

console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  Vercel 404 fix: set Root Directory to  wego-erp-v1             ║
║                                                                  ║
║  Vercel → Project → Settings → General → Root Directory          ║
║  Enter: wego-erp-v1                                              ║
║  Save → Redeploy (clear build cache)                             ║
║                                                                  ║
║  See: wego-erp-v1/DEPLOY-VERCEL.md                                ║
╚══════════════════════════════════════════════════════════════════╝
`);

process.exit(1);
