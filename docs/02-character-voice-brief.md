# The virtual ASI character — design & voice brief

The trick to a character that looks and sounds identical in every video is to
**lock one canonical asset for each** and reuse it forever. Do this once, before
you build the Phase 2 video step.

---

## 1. Lock the face (one canonical portrait)

Generate a high-res portrait with an image model, pick the single best frame, and
freeze it as `assets/character/asi-canonical.png` (kept out of git by default —
see `.gitignore`). HeyGen's **Avatar IV / Photo-to-Video** animates that one
uploaded image with realistic lip-sync, so the locked image becomes the same face
in every clip.

Because this is an **original synthetic character, not a real person**, there is
no likeness or consent issue to manage — which is the whole reason to go virtual.

**Starter image prompt** (tune, then freeze the result):

```
Head-and-shoulders portrait of an original virtual presenter representing an
artificial super-intelligence: androgynous, calm, futuristic but approachable.
Smooth matte synthetic skin with a faint luminous cyan circuitry undertone, neat
short hair, neutral confident expression, looking straight at camera. Soft studio
key light, dark teal gradient background, subtle rim light. Photoreal, sharp
focus, centered, symmetrical, shoulders square to camera, neutral closed-mouth
pose (best for lip-sync). 4k.
```

Lock these so every regeneration matches:
- **Framing:** head-and-shoulders, centered, shoulders square, facing camera.
- **Palette:** dark teal background, cyan accent — reuse on the Bannerbear cards
  too, so stills and video share a look.
- **Expression:** neutral, closed mouth (cleanest lip-sync starting frame).
- **Identity tag:** give the character a name and a one-line persona; put it in
  the YouTube channel art and the video lower-third.

When you need variants (different angle, seated, etc.), feed the **same locked
image** as a reference rather than prompting from scratch.

---

## 2. Lock the voice (one designed synthetic voice)

Use **ElevenLabs Voice Design** to generate an *original* voice from a
description, audition a few, pick one, and **save it** as a named voice. Reuse
that saved voice ID for every render. Designing a voice (vs. cloning a real
person) keeps you clear of likeness/consent issues — consistent with the
virtual-character choice.

**Starter voice description:**

```
A calm, intelligent, gender-neutral narrator for an AI-news channel. Clear and
articulate, measured pace, warm but neutral authority — a knowledgeable host, not
a hype announcer. Modern, lightly synthetic timbre with natural human cadence.
Minimal accent, broadcast-clean. Reads tech headlines with composure.
```

Recommended settings to keep delivery consistent run-to-run:
- **Stability:** medium-high (consistency over expressiveness for news).
- **Similarity:** high (stay on the designed timbre).
- **Pace:** let punctuation drive it; the `youtube` script field is already
  written as plain spoken narration with natural sentence breaks.

Record the chosen `voice_id` in your secrets/env (not in git).

---

## 3. Wire it into the pipeline (Phase 2)

The `platforms.youtube` field that Workflow A already produces **is** the script —
plain narration, 30-45 spoken seconds, no stage directions. Phase 2 takes that
text and:

1. ElevenLabs **text-to-speech** with your locked `voice_id` → MP3.
2. HeyGen **Avatar IV** with your locked portrait + that MP3 → lip-synced MP4.
3. Save the MP4 and attach it to the Reel/Short instead of (or alongside) the
   image card.

A ready-made n8n template already chains *script → ElevenLabs audio → HeyGen
video → saved MP4*; drop it onto the end of Workflow A (after **Parse + split
stories**) for the items you want as video. HeyGen markets this exact "faceless"
news-channel format for TikTok, Instagram, and YouTube Shorts.

---

## Asset checklist (lock once, reuse forever)

- [ ] `asi-canonical.png` — the one frozen portrait (high-res).
- [ ] Character name + one-line persona.
- [ ] ElevenLabs `voice_id` — the one saved designed voice.
- [ ] Brand palette shared by card + video (teal/cyan).
- [ ] Lower-third / channel art using the same face and name.

Label the character's videos as AI-generated wherever each platform requires it
(see `docs/04-runbook.md`).
