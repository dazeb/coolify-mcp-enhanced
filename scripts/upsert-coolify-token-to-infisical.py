# Upsert Coolify token into Infisical; never print secret values.
# Reads current token from ~/.cursor/mcp.json Coolify.env.COOLIFY_ACCESS_TOKEN
# Writes COOLIFY_ACCESS_TOKEN and updates COOLIFY-SHARED if present.

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
PROJECT_ID = "c9e1364d-cfb9-4f7b-a40f-2f3b339914e9"
ENVIRONMENT = "prod"
SECRET_PATH = "/"
CANONICAL_KEY = "COOLIFY_ACCESS_TOKEN"
LEGACY_KEY = "COOLIFY-SHARED"


def load_env_local() -> None:
    path = Path.home() / ".env.local"
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        # Prefer ~/.env.local over inherited shell env (shell often has host without /api)
        if key.startswith("INFISICAL_"):
            os.environ[key] = val
        else:
            os.environ.setdefault(key, val)
    domain = os.environ.get("INFISICAL_DOMAIN", "https://passwords.segsurf.se/api").rstrip("/")
    if not domain.endswith("/api"):
        domain = domain + "/api"
    os.environ["INFISICAL_DOMAIN"] = domain


def api(method: str, path: str, token: str | None = None, body: dict | None = None):
    domain = os.environ.get("INFISICAL_DOMAIN", "https://passwords.segsurf.se/api").rstrip("/")
    url = f"{domain}{path}"
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json", "User-Agent": UA}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            payload = json.loads(raw) if raw else {}
        except Exception:
            payload = {"message": "non-json error"}
        if path.endswith("/login"):
            print(f"debug login url={url} status={e.code}", file=sys.stderr)
        return e.code, payload


def login() -> str:
    client_id = os.environ.get("INFISICAL_UNIVERSAL_AUTH_CLIENT_ID") or os.environ.get(
        "INFISICAL_CLIENT_ID"
    )
    client_secret = os.environ.get("INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET") or os.environ.get(
        "INFISICAL_CLIENT_SECRET"
    )
    if not client_id or not client_secret:
        print("FAIL: missing Infisical machine identity in ~/.env.local", file=sys.stderr)
        sys.exit(1)
    status, data = api(
        "POST",
        "/v1/auth/universal-auth/login",
        body={"clientId": client_id, "clientSecret": client_secret},
    )
    if status != 200 or not data.get("accessToken"):
        print(f"FAIL: Infisical login HTTP {status}", file=sys.stderr)
        sys.exit(1)
    return data["accessToken"]


def read_token_from_mcp() -> str | None:
    mcp = Path.home() / ".cursor" / "mcp.json"
    if not mcp.exists():
        return None
    text = mcp.read_text(encoding="utf-8")
    # Avoid json load printing; extract Coolify token field only
    m = re.search(
        r'"Coolify"\s*:\s*\{.*?\"COOLIFY_ACCESS_TOKEN\"\s*:\s*\"([^\"]+)\"',
        text,
        re.S,
    )
    return m.group(1) if m else None


def get_secret(token: str, key: str) -> str | None:
    qs = f"projectId={PROJECT_ID}&environment={ENVIRONMENT}&secretPath={SECRET_PATH}"
    status, data = api("GET", f"/v4/secrets/{urllib.request.quote(key, safe='')}?{qs}", token=token)
    if status == 404:
        return None
    if status != 200:
        print(f"FAIL: get {key} HTTP {status}", file=sys.stderr)
        sys.exit(1)
    val = (data.get("secret") or {}).get("secretValue")
    return val if isinstance(val, str) and val else None


def create_secret(token: str, key: str, value: str) -> None:
    status, data = api(
        "POST",
        "/v4/secrets/" + urllib.request.quote(key, safe=""),
        token=token,
        body={
            "projectId": PROJECT_ID,
            "environment": ENVIRONMENT,
            "secretPath": SECRET_PATH,
            "secretValue": value,
            "type": "shared",
        },
    )
    if status not in (200, 201):
        print(f"FAIL: create {key} HTTP {status} keys={list(data.keys())}", file=sys.stderr)
        sys.exit(1)


def update_secret(token: str, key: str, value: str) -> None:
    status, data = api(
        "PATCH",
        "/v4/secrets/" + urllib.request.quote(key, safe=""),
        token=token,
        body={
            "projectId": PROJECT_ID,
            "environment": ENVIRONMENT,
            "secretPath": SECRET_PATH,
            "secretValue": value,
        },
    )
    if status != 200:
        print(f"FAIL: update {key} HTTP {status} keys={list(data.keys())}", file=sys.stderr)
        sys.exit(1)


def upsert(token: str, key: str, value: str) -> str:
    existing = get_secret(token, key)
    if existing is None:
        create_secret(token, key, value)
        return "created"
    if existing == value:
        return "unchanged"
    update_secret(token, key, value)
    return "updated"


def main() -> None:
    load_env_local()
    token = login()
    print("ok: Infisical login")

    source_value = read_token_from_mcp()
    if not source_value:
        # If mcp already cleaned, keep existing Infisical value
        existing = get_secret(token, CANONICAL_KEY) or get_secret(token, LEGACY_KEY)
        if not existing:
            print("FAIL: no token in mcp.json and none in Infisical", file=sys.stderr)
            sys.exit(1)
        print(f"ok: using existing Infisical value for {CANONICAL_KEY}/{LEGACY_KEY}")
        source_value = existing
    else:
        print("ok: read Coolify token from mcp.json (not printed)")

    action = upsert(token, CANONICAL_KEY, source_value)
    print(f"ok: {CANONICAL_KEY} {action}")

    legacy = get_secret(token, LEGACY_KEY)
    if legacy is None:
        create_secret(token, LEGACY_KEY, source_value)
        print(f"ok: {LEGACY_KEY} created")
    else:
        action = upsert(token, LEGACY_KEY, source_value)
        print(f"ok: {LEGACY_KEY} {action}")

    # Verify without printing
    v = get_secret(token, CANONICAL_KEY)
    print(f"ok: verify {CANONICAL_KEY} present={bool(v)} len={len(v) if v else 0}")


if __name__ == "__main__":
    main()
