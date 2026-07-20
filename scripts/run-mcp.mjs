/**
 * Launch Coolify MCP with COOLIFY_ACCESS_TOKEN from Infisical.
 * Never logs secret values. Prefer Infisical key COOLIFY_ACCESS_TOKEN;
 * falls back to COOLIFY-SHARED (legacy tagged name).
 *
 * Usage (Cursor mcp.json):
 *   command: node
 *   args: ["C:\\TEMP\\coolify-mcp-enhanced\\scripts\\run-mcp.mjs"]
 *   env: { COOLIFY_BASE_URL, COOLIFY_MCP_FORBID_SECRETS }
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_ENTRY = join(__dirname, '..', 'dist', 'index.js');

const PROJECT_ID =
  process.env.INFISICAL_PROJECT_ID || 'c9e1364d-cfb9-4f7b-a40f-2f3b339914e9';
const ENVIRONMENT = process.env.INFISICAL_ENVIRONMENT || 'prod';
const SECRET_PATH = process.env.INFISICAL_SECRET_PATH || '/';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const CANDIDATE_KEYS = ['COOLIFY_ACCESS_TOKEN', 'COOLIFY-SHARED'];

function infisicalDomain() {
  let domain = (process.env.INFISICAL_DOMAIN || 'https://passwords.segsurf.se/api').replace(
    /\/$/,
    ''
  );
  if (!domain.endsWith('/api')) domain = `${domain}/api`;
  return domain;
}

function loadEnvLocal() {
  const path = join(homedir(), '.env.local');
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key.startsWith('INFISICAL_')) {
      process.env[key] = val;
    } else if (!process.env[key]) {
      process.env[key] = val;
    }
  }
  let domain = (process.env.INFISICAL_DOMAIN || 'https://passwords.segsurf.se/api').replace(
    /\/$/,
    ''
  );
  if (!domain.endsWith('/api')) domain = `${domain}/api`;
  process.env.INFISICAL_DOMAIN = domain;
}

async function login() {
  const clientId =
    process.env.INFISICAL_UNIVERSAL_AUTH_CLIENT_ID || process.env.INFISICAL_CLIENT_ID;
  const clientSecret =
    process.env.INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET || process.env.INFISICAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing Infisical machine identity in ~/.env.local (INFISICAL_UNIVERSAL_AUTH_CLIENT_ID/SECRET)'
    );
  }
  const domain = infisicalDomain();
  const res = await fetch(`${domain}/v1/auth/universal-auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!res.ok) {
    throw new Error(`Infisical login failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data.accessToken) throw new Error('Infisical login returned no accessToken');
  return data.accessToken;
}

async function getSecret(token, secretKey) {
  const qs = new URLSearchParams({
    projectId: PROJECT_ID,
    environment: ENVIRONMENT,
    secretPath: SECRET_PATH,
  });
  const domain = infisicalDomain();
  const res = await fetch(`${domain}/v4/secrets/${encodeURIComponent(secretKey)}?${qs}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': UA },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Infisical get ${secretKey} failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  const value = data?.secret?.secretValue;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

async function resolveCoolifyToken(token) {
  for (const key of CANDIDATE_KEYS) {
    const value = await getSecret(token, key);
    if (value) return { key, value };
  }
  throw new Error(
    `Neither ${CANDIDATE_KEYS.join(' nor ')} found in Infisical ${ENVIRONMENT}${SECRET_PATH}`
  );
}

async function main() {
  if (!existsSync(DIST_ENTRY)) {
    throw new Error(`Coolify MCP dist missing: ${DIST_ENTRY} (run npm run build)`);
  }
  if (!process.env.COOLIFY_BASE_URL) {
    throw new Error('COOLIFY_BASE_URL is required in mcp.json env');
  }

  loadEnvLocal();
  const accessToken = await login();
  const { key } = await resolveCoolifyToken(accessToken);
  // Re-fetch into local only — do not keep key name with value in logs
  const coolifyToken = await getSecret(accessToken, key);
  if (!coolifyToken) throw new Error('Failed to resolve Coolify token from Infisical');

  process.stderr.write(`[coolify-mcp] token from Infisical key=${key}\n`);

  const child = spawn(process.execPath, [DIST_ENTRY], {
    stdio: 'inherit',
    env: {
      ...process.env,
      COOLIFY_ACCESS_TOKEN: coolifyToken,
      COOLIFY_BASE_URL: process.env.COOLIFY_BASE_URL,
      COOLIFY_MCP_FORBID_SECRETS: process.env.COOLIFY_MCP_FORBID_SECRETS || 'true',
    },
  });

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  process.stderr.write(`[coolify-mcp] ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
