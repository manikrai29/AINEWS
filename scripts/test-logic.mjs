// Runs the ACTUAL Code-node logic from the two workflows against sample data.
// No network needed:  node scripts/test-logic.mjs
import fs from 'node:fs';
const load = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url)));
const gen = load('../workflows/n8n-phase1-generate.json');
const pub = load('../workflows/n8n-phase1-approve-publish.json');
const code = (wf, name) => wf.nodes.find(n => n.name === name).parameters.jsCode;

const runAll  = (src, items) => new Function('$input', src)({ all: () => items });
const runEach = (src, json, node) => new Function('$json', '$', src)(json, node);
const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000).toISOString();

let ok = true;
const check = (label, cond) => { console.log((cond ? 'PASS  ' : 'FAIL  ') + label); ok = ok && cond; };

// 1) Ingestion: dedupe / 24h filter / source mapping / request build
const sample = [
  { json: { title: 'OpenAI ships a thing', link: 'https://openai.com/index/a-thing', contentSnippet: 'OpenAI announced a thing today.', isoDate: hoursAgo(1) } },
  { json: { title: 'DeepMind result', link: 'https://deepmind.google/blog/result', contentSnippet: 'A research result.', isoDate: hoursAgo(2) } },
  { json: { title: 'OpenAI ships a thing (dup)', link: 'https://openai.com/index/a-thing', contentSnippet: 'dup', isoDate: hoursAgo(1) } },
  { json: { title: 'Old NVIDIA post', link: 'https://developer.nvidia.com/blog/old', contentSnippet: 'old', isoDate: hoursAgo(72) } },
  { json: { title: 'HF blog (link via guid)', link: '', guid: 'https://huggingface.co/blog/xyz', contentSnippet: 'HF thing', isoDate: hoursAgo(5) } },
];
const norm = runAll(code(gen, 'Normalize + build request'), sample)[0].json;
check('dedupe + 24h filter -> 3 stories', norm.count === 3);
check('source mapped from domain', JSON.stringify(norm.stories.map(s => s.source).sort()) === JSON.stringify(['Google DeepMind', 'Hugging Face', 'OpenAI']));
check('HF url recovered from guid when link empty', norm.stories.some(s => s.url.includes('huggingface.co')));
check('request model = claude-sonnet-4-6', norm.body.model === 'claude-sonnet-4-6');
check('structured-output schema attached', norm.body.output_config?.format?.type === 'json_schema');
check('candidate stories embedded in prompt', norm.body.messages[0].content.includes('OpenAI'));

// 2) Parse the model's JSON into per-story items
const fakeResp = [{ json: { content: [{ type: 'text', text: JSON.stringify({ stories: [
  { source: 'OpenAI', title: 't1', url: 'https://openai.com/index/a-thing', summary: 's', score: 80, platforms: { x: 'X copy #AI', linkedin: 'LinkedIn copy. https://openai.com/index/a-thing', instagram: 'IG copy', youtube: 'spoken script' } },
  { source: 'Google DeepMind', title: 't2', url: 'https://deepmind.google/blog/result', summary: 's', score: 70, platforms: { x: 'X2', linkedin: 'L2', instagram: 'I2', youtube: 'Y2' } },
] }) }] } }];
const stories = runAll(code(gen, 'Parse + split stories'), fakeResp);
check('parser splits LLM JSON into per-story items', stories.length === 2);
check('each story item carries per-platform copy', stories.every(i => i.json.platforms?.x));

// 3) Store-free approval round-trip: build the Telegram message, recover the payload from it
const story = stories[0].json;
const bannerbear = { image_url: 'https://cdn.bannerbear.com/card123.png' };
const built = runEach(code(gen, 'Build approval message'), bannerbear, (name) => name === 'Parse + split stories' ? { item: { json: story } } : undefined);
check('approval message embeds the recoverable block', built.json.message.includes('--AINEWS--') && built.json.message.includes('--END--'));

const callback = { callback_query: { data: 'approve', message: { text: built.json.message } } };
const recovered = runEach(code(pub, 'Recover draft from message'), callback, () => undefined);
check('recovered Ayrshare body keeps the card image', recovered.json.body.mediaUrls[0] === bannerbear.image_url);
check('recovered post text = the written copy', recovered.json.body.post === story.platforms.linkedin);
check('recovered draftId = the story url', recovered.json.draftId === story.url);
check('publishes to twitter/linkedin/instagram', JSON.stringify(recovered.json.body.platforms) === JSON.stringify(['twitter', 'linkedin', 'instagram']));

console.log('\n' + (ok ? '✅ ALL CHECKS PASSED — ingestion, curation request, parsing, and the store-free approval loop all work.' : '❌ SOME CHECKS FAILED'));
process.exit(ok ? 0 : 1);
