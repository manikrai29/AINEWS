# Deploy on n8n Cloud (recommended — approvals work out of the box)

n8n Cloud gives you a managed instance with a **public HTTPS URL**, so the
Telegram Approve/Reject buttons work with zero tunnel/reverse-proxy setup. No
Docker, no server to babysit.

## 1. Create the instance
Sign up at n8n Cloud and create a workspace. You get a URL like
`https://<you>.app.n8n.cloud`.

## 2. Import both workflows
Workflows → **Add workflow** → **Import from File**, and import each of:
- `workflows/n8n-phase1-generate.json`
- `workflows/n8n-phase1-approve-publish.json`

(If the repo is public you can instead use **Import from URL** with the raw
GitHub URLs of those two files.)

Each workflow opens with a **Setup notes** sticky on the canvas.

## 3. Create credentials (Credentials → Add)
| Credential | Type | Value |
|---|---|---|
| Anthropic x-api-key | Header Auth | header `x-api-key` = `sk-ant-…` |
| Bannerbear Bearer | Header Auth | header `Authorization` = `Bearer <project key>` |
| Ayrshare Bearer | Header Auth | header `Authorization` = `Bearer <api key>` |
| Telegram Bot | Telegram API | bot token from @BotFather |

Open each node showing a credential warning and pick the matching credential.

## 4. Telegram bot + chat id
1. In Telegram, message **@BotFather** → `/newbot` → copy the token into the
   Telegram credential above.
2. Get your chat id: message your new bot once, then open
   `https://api.telegram.org/bot<token>/getUpdates` and read
   `result[].message.chat.id`.
3. Put that id in **chatId** on every Telegram node in both workflows
   (`Send to approval queue`, `Confirm published`, `Mark rejected`).

## 5. Fill the other placeholders
- **Bannerbear template id** on `Bannerbear — render card` (create a template in
  Bannerbear with text layers named `headline` and `source`).

## 6. Verify the buttons, then activate
- Open `Send to approval queue` → confirm the **✅ Approve / 🚫 Reject** inline
  keyboard is present. If your n8n version imported it differently, add it under
  *Reply Markup → Inline Keyboard*: two buttons with `callback_data` = `approve`
  and `reject`.
- **Activate** the *Approve & Publish* workflow (toggle, top-right). On Cloud
  this registers the Telegram webhook automatically — that's what makes the
  buttons call back.

## 7. Run it end to end
1. Open *Generate Drafts* → **Execute Workflow**. Drafts appear in your Telegram
   chat, each with Approve / Reject buttons.
2. Tap **Approve** → *Approve & Publish* recovers the post from the message and
   publishes via Ayrshare to X, LinkedIn, and Instagram.
3. Happy with it? Activate *Generate Drafts* too, to run on the daily schedule.

## Notes
- **YouTube** joins in Phase 2 (it needs the avatar **video**, not a still). The
  image phase publishes to X / LinkedIn / Instagram; the `youtube` script is
  already written and waiting in each draft.
- **Per-platform variants:** the publish step currently sends one post text +
  the card image to all three. To use the tailored per-platform copy, switch the
  Ayrshare node to its per-network options (`twitterOptions`, etc.) and map
  `platforms.x` / `platforms.linkedin` / `platforms.instagram` from the recovered
  payload.
- Re-run the offline logic check anytime: `node scripts/test-logic.mjs`.
