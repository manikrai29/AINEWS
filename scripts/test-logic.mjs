// Runs the ACTUAL Code-node logic from workflows/n8n-phase1-generate.json
// against sample RSS-Read output. No network needed. `node scripts/test-logic.mjs`
import fs from 'node:fs';
const wf = JSON.parse(fs.readFileSync(new URL('../workflows/n8n-phase1-generate.json', import.meta.url)));
const code = (name) => wf.nodes.find(n => n.name === name).parameters.jsCode;
const run = (src, input) => new Function('$input', src)({ all: () => input });
const hoursAgo = (h) => new Date(Date.now() - h*3600*1000).toISOString();

// Mimic what the RSS Read node emits, incl. a dup, an old item, and an empty-link HF item.
const sample = [
  { json: { title:'OpenAI ships a thing', link:'https://openai.com/index/a-thing', contentSnippet:'OpenAI announced a thing today.', isoDate:hoursAgo(1) } },
  { json: { title:'DeepMind result', link:'https://deepmind.google/blog/result', contentSnippet:'A research result.', isoDate:hoursAgo(2) } },
  { json: { title:'OpenAI ships a thing (dup)', link:'https://openai.com/index/a-thing', contentSnippet:'dup', isoDate:hoursAgo(1) } },
  { json: { title:'Old NVIDIA post', link:'https://developer.nvidia.com/blog/old', contentSnippet:'old', isoDate:hoursAgo(72) } },
  { json: { title:'HF blog (link via guid)', link:'', guid:'https://huggingface.co/blog/xyz', contentSnippet:'HF thing', isoDate:hoursAgo(5) } },
];

let ok = true;
const check = (label, cond) => { console.log((cond?'PASS  ':'FAIL  ')+label); ok = ok && cond; };

const out = run(code('Normalize + build request'), sample)[0].json;
const body = out.body;
check('dedupe + 24h filter -> 3 stories', out.count === 3);
check('source mapped from domain', JSON.stringify(out.stories.map(s=>s.source).sort()) === JSON.stringify(['Google DeepMind','Hugging Face','OpenAI']));
check('HF url recovered from guid when link empty', out.stories.some(s=>s.url.includes('huggingface.co')));
check('request model = claude-sonnet-4-6', body.model === 'claude-sonnet-4-6');
check('structured-output schema attached', body.output_config?.format?.type === 'json_schema');
check('candidate stories embedded in prompt', body.messages[0].content.includes('OpenAI'));

const fakeResp = [{ json: { content: [{ type:'text', text: JSON.stringify({ stories: [
  { source:'OpenAI', title:'t1', url:'https://openai.com/index/a-thing', summary:'s', score:80, platforms:{x:'X',linkedin:'L',instagram:'I',youtube:'Y'} },
  { source:'Google DeepMind', title:'t2', url:'https://deepmind.google/blog/result', summary:'s', score:70, platforms:{x:'X',linkedin:'L',instagram:'I',youtube:'Y'} },
] }) }] } }];
const parsed = run(code('Parse + split stories'), fakeResp);
check('parser splits LLM JSON into per-story items', parsed.length === 2);
check('each story item carries per-platform copy', parsed.every(i=>i.json.platforms?.x));

console.log('\n'+(ok?'✅ ALL CHECKS PASSED — the workflow brain works on real-shaped data.':'❌ SOME CHECKS FAILED'));
process.exit(ok?0:1);
