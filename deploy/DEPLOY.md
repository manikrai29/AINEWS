# Deploy — get a live n8n running

This sandbox can't be the live host (it's ephemeral and its egress blocks the
news feeds), so "live" runs on a host you control. Any of these works: your
laptop, a $5 VPS, n8n Cloud, Railway/Render. Below is the Docker path — one
command, durable, runs anywhere.

> The feed 403s seen in the sandbox are a sandbox-proxy artifact. On a normal
> host the official feeds load fine.

## 1. Bring up n8n (Docker)

```bash
cd deploy
cp .env.example .env
# edit .env: set N8N_ENCRYPTION_KEY (run: openssl rand -hex 24) and TZ
docker compose up -d
```

Open `http://localhost:5678` and create the owner login (first-run prompt).

## 2. Import both workflows

**UI:** top-right menu → *Import from File* → pick each file in `../workflows/`.

**Or CLI (one shot, both workflows):**

```bash
docker compose exec n8n n8n import:workflow --separate --input=/workflows
```

## 3. Add credentials (Credentials → New)

| Credential | Type | Value |
|---|---|---|
| Anthropic x-api-key | Header Auth | header `x-api-key` = `sk-ant-…` |
| Bannerbear Bearer | Header Auth | header `Authorization` = `Bearer <project key>` |
| Ayrshare Bearer | Header Auth | header `Authorization` = `Bearer <api key>` |
| Telegram Bot | Telegram API | bot token from @BotFather |

Then open each workflow and:
- attach the matching credential on its nodes,
- replace the `REPLACE_…` placeholders (Telegram chat id; Bannerbear template id).

## 4. Run it

- Open **Generate Drafts** → *Execute Workflow*. Drafts should appear in your
  Telegram chat. Activate it (toggle top-right) to run on the daily schedule.
- Wire approvals (see below), then **Approve & Publish** posts via Ayrshare.

## 5. Quick self-check (no n8n needed)

From the repo root, prove the transformation logic with the shipped test:

```bash
node scripts/test-logic.mjs
```

---

## The one real gotcha: approvals need an inbound URL

- **Workflow A (Generate)** is all *outbound* — it works on any host, no public
  URL required.
- **Workflow B (Approve & Publish)** uses a **Telegram Trigger**, which Telegram
  reaches via a webhook — so n8n must be publicly reachable over HTTPS.

Pick one:

1. **Production (recommended):** put n8n behind HTTPS on a domain (Caddy/Traefik/
   Nginx) and set `WEBHOOK_URL=https://n8n.yourdomain.com/` in `.env`. Caddy is
   two lines: `n8n.yourdomain.com { reverse_proxy n8n:5678 }`.
2. **Quick tunnel (test only):** run n8n with a tunnel
   (`docker compose exec n8n n8n start --tunnel`) for a temporary public URL.
3. **No inbound at all (polling):** skip the Telegram trigger. Have Workflow A
   write each draft to **Airtable** (status `pending`); approve by flipping the
   row to `approved`; a scheduled Workflow B polls Airtable for `approved` rows
   and publishes. Fully outbound — no public URL, no webhook. This is the most
   robust path on a plain laptop/VPS.

## Persistence & safety

- All state (workflows, credentials, executions) lives in the `n8n_data` Docker
  volume — survives restarts. Back it up.
- Keep `N8N_ENCRYPTION_KEY` stable and secret; it decrypts your credentials.
- Never commit `.env`. `.gitignore` already blocks it.
