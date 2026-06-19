# Runbook — setup, secrets, costs, labeling

## 1. Stand up n8n

- **Self-host** (cheapest): Docker or npm. Roughly free aside from a small VPS.
- **n8n Cloud**: managed, costs more, zero ops.
- **Make** is the friendlier drag-and-drop alternative if you prefer it to n8n.

Import the two workflows from `workflows/` (n8n → *Import from File*).

## 2. Credentials to create in n8n

| Credential (n8n type) | Used by | What to put in it |
|---|---|---|
| Header Auth — "Anthropic x-api-key" | Claude node | Header `x-api-key` = your Anthropic API key |
| Header Auth — "Bannerbear Bearer" | Bannerbear node | Header `Authorization` = `Bearer <project key>` |
| Header Auth — "Ayrshare Bearer" | Ayrshare node | Header `Authorization` = `Bearer <API key>` |
| Telegram API — "Telegram Bot" | Telegram nodes/trigger | Bot token from @BotFather |

Then replace the `REPLACE_…` placeholders in the nodes: the Bannerbear
`template` id, the Telegram `chatId`, and (in Workflow B) your draft-store lookup.

## 3. Secrets hygiene

Keep every key in n8n credentials or environment variables — **never** in the
repo. `.gitignore` already blocks `.env`, `secrets/`, `credentials/`, and
rendered media. The model identifier and any keys belong in config/env, not in
committed files.

## 4. The model is one line

Workflow A calls **`claude-sonnet-4-6`** — a strong, cost-efficient fit for daily
dedupe/rank/summarize at volume. It lives in the `Normalize + build request` Code
node (the `model` field of the request `body`). To raise quality, change it to a
more capable Claude model (the latest Opus). That's the only change needed; the
request shape is identical.

The call uses **structured outputs** (`output_config.format`), so the response is
always valid JSON for the parse step — no retries on malformed output.

## 5. Costs (the variable parts)

- **n8n self-hosted:** ~free (VPS only).
- **Claude API:** small — one summarization call per day over a short candidate
  list. Sonnet-tier pricing keeps this in cents/day territory.
- **Bannerbear / Placid:** per-render image generation.
- **Ayrshare:** subscription for multi-platform publishing.
- **Phase 2 (ElevenLabs + HeyGen):** the main variable cost — daily avatar video
  is where spend scales. Start video on a subset (e.g. the top story) before
  going daily-everywhere.

## 6. Build order

1. **Now:** fetch → curate/write → branded image → approve → publish (text +
   image) to all four platforms. Get it running daily and trustworthy.
2. **Next:** add the ASI character video (Phase 2) for Reels and Shorts using the
   locked face + voice (`docs/02-character-voice-brief.md`).
3. **Later:** analytics, per-platform best-time scheduling, and auto-approving
   your most-trusted official sources.

## 7. AI-content labeling

Label the character's videos (and AI-generated stills where required) as
AI-generated on each platform that asks for it — e.g. YouTube's altered/synthetic
content disclosure, Instagram/TikTok AI labels, and a clear note in your channel
bio. Build the habit from day one; it protects the brand.

## 8. Operating checklist

- [ ] Both workflows imported; credentials wired; `REPLACE_…` filled in.
- [ ] Approve/Reject inline keyboard added to the approval-queue node, with a
      draft store keyed by `draftId`.
- [ ] A test run produces drafts in your Telegram chat.
- [ ] Approving one publishes via Ayrshare to all four platforms.
- [ ] Feed URLs in `config/sources.json` re-checked.
- [ ] AI-labeling enabled where each platform requires it.
