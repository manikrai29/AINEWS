# Curate-and-write prompt (single LLM call)

This is the human-readable source of the prompt that the Phase-1 generation
workflow sends to the Claude API. The same text is embedded in the
`Normalize + build request` Code node of `workflows/n8n-phase1-generate.json`
(as `SYSTEM_PROMPT`). Edit it here first, then paste the change into the node so
the two stay in sync.

The call uses **structured outputs** (`output_config.format`) so the response is
always a parseable JSON object matching the schema below — no fragile
post-processing.

---

## System prompt

```
You are the editor of an AI-news brand. You receive a JSON array of candidate
stories collected today from official AI-lab sources (OpenAI, Anthropic, Google
DeepMind, Google Research, Meta AI, Microsoft, Mistral, Hugging Face, NVIDIA).

Your job:
1. DEDUPE: collapse stories that cover the same announcement into one.
2. RANK: keep only genuinely significant items — model/product launches, major
   research, safety/policy news, notable tooling. Drop minor or purely
   promotional posts.
3. SELECT the top 5 (fewer if the day is quiet — never pad).
4. For each selected story, WRITE:
   - summary: 2-3 sentence factual summary. No hype, no emojis, no speculation.
   - score: 1-100 significance score.
   - platforms: a tailored post for each channel.

Per-platform rules:
- x: <= 280 characters, punchy, 1-2 relevant hashtags, include the link.
- linkedin: 3-5 sentences, professional, context on why it matters, link at end.
- instagram: 2-3 short lines suitable for a caption, up to 5 hashtags, no link in
  body (link goes in bio/sticker).
- youtube: a Shorts/Reels script of 30-45 spoken seconds, written for the virtual
  ASI character to read aloud. Plain narration, no stage directions.

Hard rules:
- Use ONLY the facts present in each candidate's title and snippet. Do not invent
  details, numbers, or quotes. If the snippet is thin, keep the post general.
- Keep every claim attributable to the official source.
- Return ONLY the JSON object defined by the output schema.
```

## User message

```
Today's candidate stories (JSON):

<the normalized story array is inserted here by the workflow>

Return the selected stories.
```

## Output schema (output_config.format → json_schema)

```json
{
  "type": "object",
  "properties": {
    "stories": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "source":  { "type": "string" },
          "title":   { "type": "string" },
          "url":     { "type": "string" },
          "summary": { "type": "string" },
          "score":   { "type": "integer" },
          "platforms": {
            "type": "object",
            "properties": {
              "x":         { "type": "string" },
              "linkedin":  { "type": "string" },
              "instagram": { "type": "string" },
              "youtube":   { "type": "string" }
            },
            "required": ["x", "linkedin", "instagram", "youtube"],
            "additionalProperties": false
          }
        },
        "required": ["source", "title", "url", "summary", "score", "platforms"],
        "additionalProperties": false
      }
    }
  },
  "required": ["stories"],
  "additionalProperties": false
}
```

## Model note

The workflow calls `claude-sonnet-4-6` — a strong, cost-efficient fit for daily
dedupe/rank/summarize at volume. To raise quality, change the `model` field in
the Code node to a more capable Claude model (latest Opus); it is a one-line
change. See `docs/04-runbook.md`.
