# Phase 1 — the daily pipeline, node by node

Phase 1 publishes **text + a branded image** to all four platforms, with a
human approval step before anything goes live. It is two n8n workflows:

1. `workflows/n8n-phase1-generate.json` — runs on a schedule, builds the drafts,
   and pushes them to your approval queue.
2. `workflows/n8n-phase1-approve-publish.json` — reacts to your Approve/Reject
   tap and publishes via Ayrshare.

Both are **skeletons**: they import and show the full wiring, but you must add
credentials and a couple of placeholder IDs (marked `REPLACE_…`). Node
`typeVersion`s target a recent n8n; if your instance complains, open the node and
re-pick the type — the logic is unaffected.

---

## Flow at a glance

```
Schedule → Feed list → Fetch RSS → Normalize+build request
        → Claude (curate & write) → Parse+split → Bannerbear → Approval queue
                                                                     │  (you tap Approve)
                                                                     ▼
                                            Telegram trigger → Approved? → Load draft → Ayrshare → Confirm
```

---

## Workflow A — generate drafts

**1. Daily 08:00** (`scheduleTrigger`)
Fires once a day. Change the hour in the node, or add more triggers for multiple
runs.

**2. Feed list (native RSS)** (`code`)
Emits one item per source that has a working native RSS feed (OpenAI, DeepMind,
Google Research, Hugging Face, NVIDIA, Microsoft). The no-RSS sources (Anthropic,
Meta, Mistral) are handled on a separate branch — see `docs/03-sources.md`.

**3. Fetch RSS** (`rssFeedRead`, url = `{{ $json.url }}`)
Runs once per feed and outputs all recent items from each.

**4. Normalize + build request** (`code`, run once for all items)
The workhorse. It:
- keeps only items published in the last 24h,
- dedupes by URL,
- tags each item's `source` from its link domain,
- trims a 600-char snippet,
- and assembles the **full Claude API request body** (model, system prompt,
  user message, and the `output_config.format` JSON schema) as `json.body`.

Keeping the request body here means the HTTP node stays trivial. The system
prompt and schema are mirrored in `prompts/curate-and-write.md` — edit there
first, then paste in.

**5. Claude — curate & write** (`httpRequest` → `POST /v1/messages`)
Sends `{{ JSON.stringify($json.body) }}`. Auth is a generic **Header Auth**
credential supplying `x-api-key`; the node also sends `anthropic-version:
2023-06-01`. Because the request uses structured outputs, the reply's first text
block is always valid JSON matching our schema.

**6. Parse + split stories** (`code`)
`JSON.parse`s the model's text block and emits one n8n item per selected story
(`source`, `title`, `url`, `summary`, `score`, `platforms.{x,linkedin,instagram,youtube}`).

**7. Bannerbear — render card** (`httpRequest` → sync endpoint)
Renders one branded news card per story from your template, passing `headline`
and `source` as modifications. The synchronous endpoint returns `image_url`
directly (no polling). Swap in Placid if you prefer.

**8. Send to approval queue** (`telegram` sendMessage)
Posts each draft (source, score, title, the X copy, the card URL, the source
link) to your Telegram chat. **To make Approve/Reject buttons work**, open this
node and add an inline keyboard with two buttons whose `callback_data` is
`approve:<draftId>` and `reject:<draftId>`, and write each draft to a store
(Airtable/DB) keyed by `draftId`. (Kept off the skeleton so the JSON imports
cleanly across n8n versions.)

> Prefer a board to a chat? Replace this node with an **Airtable** node that
> creates a row per draft with status `pending`, and approve by flipping the
> status. Then trigger Workflow B from an Airtable "status = approved" poll
> instead of the Telegram trigger.

---

## Workflow B — approve & publish

**1. On approval button** (`telegramTrigger`, `callback_query`)
Wakes when you tap a button.

**2. Approved?** (`if`)
True branch when `callback_query.data` starts with `approve:`; false branch marks
the draft rejected.

**3. Load draft by id** (`code`)
Extracts `draftId` from the callback data. **Replace the placeholder** with a
real lookup of the stored draft (an Airtable "get" node before this, or an HTTP
call to your DB), producing the Ayrshare body: `post`, `platforms`, `mediaUrls`
(the Bannerbear `image_url`).

**4. Ayrshare — publish** (`httpRequest` → `POST /api/post`)
One call fans out to X, LinkedIn, Instagram, and YouTube. Auth is a Header Auth
credential with `Authorization: Bearer <Ayrshare key>`.

**5. Confirm / Mark rejected** (`telegram`)
Closes the loop with a confirmation or a rejection note.

---

## Why this shape

- **One LLM call** does dedupe + rank + per-platform writing, returning strict
  JSON — fewer moving parts and no brittle text parsing.
- **Approval gate** sits between generation and publishing, so nothing reaches an
  audience without your nod — the right default for a news brand.
- **Stateless generation, stateful approval** are split into two workflows
  because Telegram's button callback is a separate trigger. That separation is a
  feature: you can regenerate drafts without touching the publish path.

Next: lock your character and voice (`docs/02-character-voice-brief.md`) for the
Phase 2 video step.
