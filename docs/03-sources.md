# Sources — official only, two ingestion paths

The machine-readable list lives in `config/sources.json`. The brand promise is
**official sources only**: aggregators may help you *discover* a story, but every
published item must be checked against the primary post first.

Not every lab publishes RSS, so there are two ingestion paths.

## Path 1 — native RSS (the easy ones)

Read directly with the n8n **RSS Read** node. Verified working:

| Source | Feed |
|---|---|
| OpenAI | `https://openai.com/news/rss.xml` |
| Google DeepMind | `https://deepmind.google/blog/rss.xml` |
| Google Research | `https://research.googleblog.com/feeds/posts/default?alt=rss` |
| Hugging Face | `https://huggingface.co/blog/feed.xml` |
| NVIDIA Developer | `https://developer.nvidia.com/blog/feed` |
| Microsoft AI | `https://blogs.microsoft.com/ai/feed/` (standard WordPress `/feed/`; confirm it loads) |

These are exactly the six the **Feed list** node emits in Workflow A.

**Hugging Face caveat:** its feed omits the per-item `<link>` in some readers. The
normalize node already falls back to `guid` when `link` is empty.

## Path 2 — no native RSS (Anthropic, Meta AI, Mistral)

These don't publish an official feed. Read their index pages instead:

| Source | Index page |
|---|---|
| Anthropic | `https://www.anthropic.com/news` (also `…/engineering`) |
| Meta AI | `https://ai.meta.com/blog/` |
| Mistral AI | `https://mistral.ai/news/` |

To add them, build a small parallel branch in Workflow A:

```
Schedule → (Code: html source list) → HTTP Request (GET index page)
        → HTML Extract (article links + titles) → merge into the same
          "Normalize + build request" node as the RSS branch
```

- **HTTP Request** node: GET the index URL.
- **HTML Extract** node: a CSS selector returning each post's link + title (and a
  blurb if present). Selectors change when sites are redesigned — keep them in one
  place and expect occasional maintenance.
- Feed the extracted items into the **same** Normalize node (via a Merge node) so
  they get the same dedupe / 24h filter / Claude treatment.

If you'd rather not maintain selectors, a hosted feed-generator service can turn
any of these pages into an RSS URL you can drop into Path 1 — just keep the
"verify against the primary post before publishing" rule.

## Keeping it honest

- The Claude prompt is instructed to use **only** the facts in each item's title
  and snippet, and to keep every claim attributable to the source — no invented
  numbers or quotes.
- The approval step is your last check: if a draft drifts from the official post,
  reject it.
- Re-check feed URLs periodically; labs occasionally move or add them. Update
  `config/sources.json` and the **Feed list** node together.
