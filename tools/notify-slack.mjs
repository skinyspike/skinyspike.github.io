/* =============================================================
   작성된 가이드를 슬랙으로 보냅니다.
   -------------------------------------------------------------
   사용법
     node tools/notify-slack.mjs <slug>
     node tools/notify-slack.mjs <slug> --dry-run     보낼 내용만 출력

   웹훅 주소
     환경변수 WONDERPLANT_SLACK_WEBHOOK 에서 읽습니다.
     ⚠ 주소를 이 파일이나 저장소 안 어디에도 적지 마세요. 공개 저장소입니다.

     설정 (PowerShell, 한 번만):
       setx WONDERPLANT_SLACK_WEBHOOK "https://hooks.slack.com/services/..."
     설정 후 새 터미널에서 적용됩니다.

   종료 코드
     0 성공 / 1 실패 (웹훅 없음, 파일 없음, 전송 실패)
   ============================================================= */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.wonderplant.xyz';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const slug = args.find((a) => !a.startsWith('--'));

function die(msg) {
  console.error('실패:', msg);
  process.exit(1);
}

if (!slug) die('slug 를 인자로 넘기세요. 예: node tools/notify-slack.mjs pet-car-sickness');

const webhook = process.env.WONDERPLANT_SLACK_WEBHOOK;
if (!webhook && !dryRun) {
  die(
    '환경변수 WONDERPLANT_SLACK_WEBHOOK 이 없습니다.\n' +
      '  PowerShell 에서: setx WONDERPLANT_SLACK_WEBHOOK "https://hooks.slack.com/services/..."\n' +
      '  설정한 뒤 새 터미널을 열어야 적용됩니다.'
  );
}

/* ---------- 원고 읽기 ---------- */

const src = join(ROOT, 'content/guides', `${slug}.html`);
if (!existsSync(src)) die(`원고가 없습니다: ${src}`);

const raw = readFileSync(src, 'utf8');
const m = raw.match(/<!--meta\s*([\s\S]*?)\s*meta-->/);
if (!m) die(`${slug}.html 에 meta 블록이 없습니다`);

let meta;
try {
  meta = JSON.parse(m[1]);
} catch (e) {
  die(`meta 블록의 JSON 이 깨졌습니다 — ${e.message}`);
}

const bodyHtml = raw.slice(m.index + m[0].length).trim();

/* HTML 을 슬랙 mrkdwn 으로 옮긴다. 완벽할 필요는 없고 읽히면 된다. */
function toMrkdwn(html) {
  return html
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '\n\n*$1*\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '\n_$1_\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '• $1\n')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<\/tr>/g, '\n')
    .replace(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g, '$1  |  ')
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, '*$1*')
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/g, '_$1_')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((l) => l.trim().replace(/\|$/, '').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const plain = bodyHtml
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const body = toMrkdwn(bodyHtml);

/* ---------- 슬랙 블록 ---------- */

/* section 블록의 text 는 3,000자가 상한이라 잘라서 여러 개로 보낸다. */
function chunk(text, size = 2800) {
  const out = [];
  let rest = text;
  while (rest.length > size) {
    let cut = rest.lastIndexOf('\n\n', size);
    if (cut < size * 0.5) cut = rest.lastIndexOf('\n', size);
    if (cut < size * 0.5) cut = size;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

const blocks = [
  {
    type: 'header',
    text: { type: 'plain_text', text: `새 가이드: ${meta.title}`.slice(0, 150), emoji: true },
  },
  {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `*${meta.category}*  ·  ${plain.length.toLocaleString('ko-KR')}자  ·  ${meta.date}  ·  \`${slug}\``,
      },
    ],
  },
  { type: 'section', text: { type: 'mrkdwn', text: `_${meta.description}_` } },
  { type: 'divider' },
  ...chunk(body).map((t) => ({ type: 'section', text: { type: 'mrkdwn', text: t } })),
  { type: 'divider' },
  {
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text:
          `원고 \`content/guides/${slug}.html\`  ·  ` +
          `발행 예정 주소 ${SITE}/guide-${slug}.html\n` +
          `커밋까지 끝났습니다. *푸시는 직접 하셔야 사이트에 올라갑니다* — \`git push\``,
      },
    ],
  },
];

const payload = {
  text: `새 가이드: ${meta.title}`, // 알림 미리보기 및 블록 미지원 클라이언트용
  blocks,
};

/* ---------- 전송 ---------- */

if (dryRun) {
  console.log(`[dry-run] ${meta.title}`);
  console.log(`[dry-run] ${plain.length}자, 블록 ${blocks.length}개`);
  console.log('---');
  console.log(body.slice(0, 600) + (body.length > 600 ? '\n…' : ''));
  process.exit(0);
}

const res = await fetch(webhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const text = await res.text();
if (!res.ok || text.trim() !== 'ok') {
  die(`슬랙이 거절했습니다 (HTTP ${res.status}): ${text.slice(0, 300)}`);
}

console.log(`슬랙 전송 완료 — ${meta.title} (${plain.length}자)`);
