import {
  redactEnvironmentVariable,
  redactSensitiveText,
  sanitizeForMcp,
  shouldRevealSecrets,
} from '../lib/sanitize.js';

describe('sanitizeForMcp', () => {
  const originalForbid = process.env.COOLIFY_MCP_FORBID_SECRETS;

  afterEach(() => {
    if (originalForbid === undefined) {
      delete process.env.COOLIFY_MCP_FORBID_SECRETS;
    } else {
      process.env.COOLIFY_MCP_FORBID_SECRETS = originalForbid;
    }
  });

  it('redacts env var value and real_value by default', () => {
    const vars = [
      { key: 'AWS_SECRET_ACCESS_KEY', value: 'supersecret', real_value: 'supersecret' },
      { key: 'PUBLIC_URL', value: 'https://example.com', real_value: 'https://example.com' },
    ];
    const out = sanitizeForMcp(vars, { mode: 'detail' }) as Array<Record<string, unknown>>;
    expect(out[0].value).toBe('***');
    expect(out[0].real_value).toBe('***');
    expect(out[0].key).toBe('AWS_SECRET_ACCESS_KEY');
    expect(out[1].value).toBe('***');
  });

  it('reveals env values when revealSecrets is true', () => {
    delete process.env.COOLIFY_MCP_FORBID_SECRETS;
    const vars = [{ key: 'TOKEN', value: 'abc', real_value: 'abc' }];
    const out = sanitizeForMcp(vars, { mode: 'detail', revealSecrets: true }) as Array<
      Record<string, unknown>
    >;
    expect(out[0].value).toBe('abc');
  });

  it('never reveals when COOLIFY_MCP_FORBID_SECRETS=true', () => {
    process.env.COOLIFY_MCP_FORBID_SECRETS = 'true';
    expect(shouldRevealSecrets(true)).toBe(false);
    const vars = [{ key: 'TOKEN', value: 'abc', real_value: 'abc' }];
    const out = sanitizeForMcp(vars, { mode: 'detail', revealSecrets: true }) as Array<
      Record<string, unknown>
    >;
    expect(out[0].value).toBe('***');
  });

  it('summarizes services without docker_compose bodies', () => {
    const services = [
      {
        uuid: 'svc-1',
        name: 'openbrain',
        status: 'running:healthy',
        docker_compose: 'services:\n  app:\n    environment:\n      - AWS_SECRET_ACCESS_KEY=leak\n',
        applications: [{ uuid: 'a1', name: 'app', status: 'running', fqdn: 'https://x' }],
      },
    ];
    const out = sanitizeForMcp(services) as Array<Record<string, unknown>>;
    expect(out[0].uuid).toBe('svc-1');
    expect(out[0].docker_compose).toBeUndefined();
    expect((out[0].applications as Array<Record<string, unknown>>)[0].name).toBe('app');
    expect(JSON.stringify(out)).not.toContain('leak');
  });

  it('summarizes applications without heavy secret fields', () => {
    const apps = [
      {
        uuid: 'app-1',
        name: 'usesend',
        status: 'running',
        fqdn: 'https://mail.example.com',
        git_repository: 'https://github.com/org/repo',
        build_pack: 'dockerfile',
        manual_webhook_secret_github: 'whsec_xxx',
        docker_compose_raw: 'password: leakme',
      },
    ];
    const out = sanitizeForMcp(apps) as Array<Record<string, unknown>>;
    expect(out[0].name).toBe('usesend');
    expect(out[0].manual_webhook_secret_github).toBeUndefined();
    expect(out[0].docker_compose_raw).toBeUndefined();
    expect(JSON.stringify(out)).not.toContain('whsec');
    expect(JSON.stringify(out)).not.toContain('leakme');
  });

  it('redacts secret assignments inside compose text', () => {
    const text = [
      'services:',
      '  api:',
      '    environment:',
      '      - AWS_SECRET_ACCESS_KEY=AKIAxxx',
      '      - GITHUB_TOKEN=ghp_xxx',
      '      - PUBLIC_URL=https://ok.example',
    ].join('\n');
    const redacted = redactSensitiveText(text);
    expect(redacted).toContain('AWS_SECRET_ACCESS_KEY=***');
    expect(redacted).toContain('GITHUB_TOKEN=***');
    expect(redacted).toContain('PUBLIC_URL=https://ok.example');
  });

  it('redactEnvironmentVariable leaves empty values alone', () => {
    const out = redactEnvironmentVariable({ key: 'X', value: '', real_value: '' }, false);
    expect(out.value).toBe('');
  });
});
