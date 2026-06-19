# AINEWS — an automated AI-news brand

A no-code / wire-together system that pulls AI news from **official sources**,
has an LLM dedupe-rank-and-write the posts, renders a branded image per story,
routes everything through a **human approval** step, and publishes to X,
LinkedIn, Instagram, and YouTube — with an original **virtual ASI presenter**
(consistent face + voice) for Reels and Shorts in Phase 2.

This repo is the buildable starter kit: importable n8n workflows, the source
list, the LLM prompt, and the character/voice brief.

---

## The stack

- **n8n** — the brain that connects everything (self-host to keep costs ~zero, or
  use n8n Cloud). Make is the drag-and-drop alternative.
- **RSS + HTML reads** — fetch from official lab sources.
- **Claude API** — dedupes, ranks, and writes each platform's post in one call
  with structured-JSON output.
- **Bannerbear / Placid** — auto-renders a branded news card per story.
- **Telegram (or Airtable)** — your approval queue; nothing publishes without a tap.
- **Ayrshare** — one integration publishes to all four platforms.
- **(Phase 2) HeyGen Avatar IV + ElevenLabs** — the virtual ASI character, on video.

## How it flows (daily, automatic)

```
schedule → pull official feeds → LLM dedupes & picks top stories
        → LLM writes a per-platform version → Bannerbear renders the card
        → drafts hit your approval queue → you tap Approve → Ayrshare posts
```

## Repo layout

```
README.md
config/sources.json                     # official feeds (RSS) + no-RSS index pages
prompts/curate-and-write.md             # the single LLM prompt + output schema
workflows/
  n8n-phase1-generate.json              # schedule → fetch → curate → render → approval queue
  n8n-phase1-approve-publish.json       # approve tap → publish via Ayrshare
docs/
  01-phase1-pipeline.md                 # node-by-node walkthrough
  02-character-voice-brief.md           # ASI character image prompt + ElevenLabs voice brief
  03-sources.md                         # official sources + the two ingestion paths
  04-runbook.md                         # setup, credentials, costs, AI-labeling
deploy/
  N8N_CLOUD.md                          # managed-host guide (approvals work out of the box)
  docker-compose.yml                    # one-command self-hosted n8n
  .env.example                          # host config (keys go in n8n credentials, not here)
  DEPLOY.md                             # self-host step-by-step: up → import → credentials → run
scripts/
  test-logic.mjs                        # runs the real Code-node logic against sample data
```

## Quick start (live host)

**On n8n Cloud (recommended):** follow `deploy/N8N_CLOUD.md` — import the two
workflows, add credentials, activate. The public URL is automatic, so the
Telegram Approve/Reject buttons work with no extra setup.

**Self-host with Docker:**

```bash
cd deploy && cp .env.example .env      # set N8N_ENCRYPTION_KEY + TZ
docker compose up -d                   # n8n live at http://localhost:5678
docker compose exec n8n n8n import:workflow --separate --input=/workflows
```

Then, per `deploy/DEPLOY.md`:
1. Create the four credentials (Anthropic, Bannerbear, Ayrshare, Telegram) and
   fill the `REPLACE_…` placeholders.
2. Run **Workflow A** once — drafts land in your Telegram chat.
3. Wire approvals (Telegram buttons with a public URL, or the no-inbound Airtable
   polling path in `DEPLOY.md`) — then **Workflow B** publishes everywhere.
4. Lock your character + voice (`docs/02-character-voice-brief.md`) and add the
   Phase 2 video step.

Sanity-check the transformation logic anytime with `node scripts/test-logic.mjs`.

## Sources (official only)

OpenAI, Anthropic, Google DeepMind, Google Research, Meta AI, Microsoft AI,
Mistral, Hugging Face, NVIDIA. Six publish native RSS; three (Anthropic, Meta,
Mistral) need an index-page read. Details and verified feed URLs in
`docs/03-sources.md` / `config/sources.json`.

## Notes on the workflow files

The two JSON files are **valid, importable skeletons** (verified to parse, with
all embedded scripts syntax-checked). They deliberately leave credentials and a
few IDs as `REPLACE_…` placeholders, and keep the Telegram inline keyboard off
the canvas so the JSON imports cleanly across n8n versions — `docs/01` explains
exactly what to add. They could not be live-tested end-to-end here (that needs a
running n8n with real keys), so treat the first run as a wiring pass.

## Build order

1. **Now:** text + image to all four platforms, daily, behind approval.
2. **Next:** add the ASI character video for Reels/Shorts.
3. **Later:** analytics, best-time scheduling, auto-approve trusted sources.

Label AI-generated videos where each platform requires it.
