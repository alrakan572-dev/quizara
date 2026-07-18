import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const scanRoots = ["src", "supabase/functions"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const failures = [];

const forbidden = [
  { name: "service-role secret in frontend", roots: ["src"], pattern: /SUPABASE_SERVICE_ROLE_KEY|service_role\s*[:=]/i },
  { name: "hard-coded Telegram test ID", roots: ["src", "supabase/functions"], pattern: /\b123456789\b/ },
  { name: "private key material", roots: ["src", "supabase/functions"], pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", "dist", ".git"].includes(entry.name)) files.push(...await walk(path));
    } else if (extensions.has(extname(entry.name))) {
      files.push(path);
    }
  }
  return files;
}

for (const scanRoot of scanRoots) {
  let files = [];
  try { files = await walk(scanRoot); } catch { continue; }
  for (const file of files) {
    const content = await readFile(join(root, file), "utf8");
    for (const rule of forbidden) {
      if (rule.roots.some((allowedRoot) => file === allowedRoot || file.startsWith(`${allowedRoot}/`)) && rule.pattern.test(content)) {
        failures.push(`${rule.name}: ${relative(root, join(root, file))}`);
      }
    }
  }
}

const envExample = await readFile(join(root, ".env.example"), "utf8");
if (/SERVICE_ROLE|BOT_TOKEN|SESSION_SECRET/i.test(envExample)) {
  failures.push(".env.example exposes a server-only secret variable name");
}

if (failures.length) {
  console.error("Production audit failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log("Production audit passed: no frontend service-role secret, test Telegram ID, or private key material found.");
