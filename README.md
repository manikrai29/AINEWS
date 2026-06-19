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
```

## Quick start

1. Stand up n8n and import both files from `workflows/` (see `docs/04-runbook.md`).
2. Create the four credentials (Anthropic, Bannerbear, Ayrshare, Telegram) and
   fill the `REPLACE_…` placeholders.
3. Run **Workflow A** once — drafts land in your Telegram chat.
4. Add Approve/Reject buttons + a draft store, then approving a draft fires
   **Workflow B** and publishes everywhere.
5. Lock your character + voice (`docs/02-character-voice-brief.md`) and add the
   Phase 2 video step.

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
