/**
 * Sanitize Coolify API payloads before returning them through MCP.
 * Prevents agents from dumping plaintext secrets (env values, compose embeds).
 */

const SECRET_KEY_RE =
  /(password|passwd|secret|token|api[_-]?key|private[_-]?key|access[_-]?key|secret[_-]?key|credential|auth|webhook|aws_|github_)/i;

const HEAVY_SECRET_FIELDS = new Set([
  'docker_compose',
  'docker_compose_raw',
  'docker_compose_custom',
  'custom_docker_run_options',
  'custom_nginx_configuration',
  'custom_labels',
  'manual_webhook_secret_github',
  'manual_webhook_secret_gitlab',
  'manual_webhook_secret_bitbucket',
  'manual_webhook_secret_gitea',
  'private_key_id',
]);

export type SanitizeMode = 'summary' | 'detail';

export interface SanitizeOptions {
  /** When true, keep env values / compose bodies (still deep-redacts known secret keys unless allowSecrets). */
  revealSecrets?: boolean;
  /** summary omits heavy fields; detail keeps structure but redacts secrets. */
  mode?: SanitizeMode;
}

function secretsExplicitlyAllowed(): boolean {
  // Hard lockdown: never return plaintext secrets from this process.
  if (process.env.COOLIFY_MCP_FORBID_SECRETS === 'true') {
    return false;
  }
  return true;
}

export function shouldRevealSecrets(revealSecrets?: boolean): boolean {
  return Boolean(revealSecrets) && secretsExplicitlyAllowed();
}

/** Redact common secret assignments inside docker-compose / nginx / label blobs. */
export function redactSensitiveText(text: string): string {
  if (!text) return text;
  let out = text;
  // KEY=value / KEY: value (YAML / env / compose)
  out = out.replace(
    /^([ \t]*(?:- )?[\w.-]*(?:password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|credential|aws_|github_)[\w.-]*\s*[:=]\s*)(.+)$/gim,
    '$1***'
  );
  // JSON-ish "key": "value"
  out = out.replace(
    /("[\w.-]*(?:password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|credential|aws_|github_)[\w.-]*"\s*:\s*")([^"]*)(")/gi,
    '$1***$3'
  );
  return out;
}

export function redactEnvironmentVariable(
  variable: Record<string, unknown>,
  reveal: boolean
): Record<string, unknown> {
  if (reveal) return { ...variable };
  const next = { ...variable };
  if (typeof next.value === 'string' && next.value.length > 0) {
    next.value = '***';
  }
  if (typeof next.real_value === 'string' && next.real_value.length > 0) {
    next.real_value = '***';
  }
  return next;
}

function summarizeApplication(app: Record<string, unknown>): Record<string, unknown> {
  return {
    uuid: app.uuid,
    name: app.name,
    description: app.description,
    status: app.status,
    fqdn: app.fqdn,
    git_repository: app.git_repository,
    git_branch: app.git_branch,
    build_pack: app.build_pack,
    dockerfile_location: app.dockerfile_location,
    docker_compose_location: app.docker_compose_location,
    server_id: app.server_id,
    environment_id: app.environment_id,
    project_id: app.project_id,
    created_at: app.created_at,
    updated_at: app.updated_at,
  };
}

function summarizeNestedComponent(item: Record<string, unknown>): Record<string, unknown> {
  return {
    uuid: item.uuid,
    name: item.name,
    human_name: item.human_name,
    status: item.status,
    fqdn: item.fqdn,
    image: item.image,
  };
}

function summarizeService(service: Record<string, unknown>): Record<string, unknown> {
  const applications = Array.isArray(service.applications)
    ? service.applications.map((a) =>
        summarizeNestedComponent(a as Record<string, unknown>)
      )
    : undefined;
  const databases = Array.isArray(service.databases)
    ? service.databases.map((d) =>
        summarizeNestedComponent(d as Record<string, unknown>)
      )
    : undefined;

  return {
    uuid: service.uuid,
    name: service.name,
    description: service.description,
    status: service.status,
    server_id: service.server_id,
    environment_id: service.environment_id,
    applications,
    databases,
    created_at: service.created_at,
    updated_at: service.updated_at,
  };
}

function redactObject(
  value: unknown,
  reveal: boolean,
  mode: SanitizeMode,
  path: string[]
): unknown {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    // Env-var arrays: [{ key, value, real_value, ... }]
    if (
      value.length > 0 &&
      typeof value[0] === 'object' &&
      value[0] !== null &&
      'key' in (value[0] as object) &&
      ('value' in (value[0] as object) || 'real_value' in (value[0] as object))
    ) {
      return value.map((item) =>
        redactEnvironmentVariable(item as Record<string, unknown>, reveal)
      );
    }
    return value.map((item, i) => redactObject(item, reveal, mode, [...path, String(i)]));
  }

  if (typeof value === 'string') {
    const key = path[path.length - 1] ?? '';
    if (!reveal && HEAVY_SECRET_FIELDS.has(key)) {
      return `[redacted ${value.length} chars]`;
    }
    if (!reveal && SECRET_KEY_RE.test(key) && value.length > 0) {
      return '***';
    }
    if (!reveal && (key === 'docker_compose' || key === 'docker_compose_raw' || key.includes('compose'))) {
      return redactSensitiveText(value);
    }
    return value;
  }

  if (typeof value !== 'object') return value;

  const obj = value as Record<string, unknown>;

  // Top-level list item summarization for applications/services
  if (mode === 'summary') {
    if (looksLikeApplication(obj)) {
      return summarizeApplication(obj);
    }
    if (looksLikeService(obj)) {
      return summarizeService(obj);
    }
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (mode === 'summary' && HEAVY_SECRET_FIELDS.has(k)) {
      continue;
    }
    if (!reveal && HEAVY_SECRET_FIELDS.has(k) && typeof v === 'string') {
      out[k] = `[redacted ${v.length} chars — pass reveal_secrets=true to inspect]`;
      continue;
    }
    if (!reveal && SECRET_KEY_RE.test(k) && typeof v === 'string' && v.length > 0) {
      out[k] = '***';
      continue;
    }
    if (k === 'value' || k === 'real_value') {
      out[k] = !reveal && typeof v === 'string' && v.length > 0 ? '***' : v;
      continue;
    }
    out[k] = redactObject(v, reveal, mode, [...path, k]);
  }
  return out;
}

function looksLikeApplication(obj: Record<string, unknown>): boolean {
  return (
    typeof obj.uuid === 'string' &&
    typeof obj.name === 'string' &&
    ('build_pack' in obj || 'git_repository' in obj || 'fqdn' in obj) &&
    !('docker_compose_raw' in obj && Array.isArray(obj.applications))
  );
}

function looksLikeService(obj: Record<string, unknown>): boolean {
  return (
    typeof obj.uuid === 'string' &&
    typeof obj.name === 'string' &&
    (Array.isArray(obj.applications) || 'docker_compose' in obj || 'docker_compose_raw' in obj)
  );
}

/**
 * Sanitize any Coolify payload for MCP tool output.
 * Default: summary mode + secrets redacted.
 */
export function sanitizeForMcp(data: unknown, options: SanitizeOptions = {}): unknown {
  const reveal = shouldRevealSecrets(options.revealSecrets);
  const mode = options.mode ?? 'summary';
  return redactObject(data, reveal, mode, []);
}

/** Convenience for tool handlers. */
export function jsonToolContent(data: unknown, options: SanitizeOptions = {}): {
  content: Array<{ type: 'text'; text: string }>;
} {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(sanitizeForMcp(data, options), null, 2),
      },
    ],
  };
}
