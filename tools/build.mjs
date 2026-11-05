/* =============================================================
   정적 페이지 생성기
   -------------------------------------------------------------
   무엇을 만드는가
     1) notice-<id>.html      공지사항 상세 — 글마다 실제 파일
     2) guide-<slug>.html     가이드 본문 — content/guides/*.html 를 감쌈
     3) guide.html            가이드 목록 (허브)
     4) notice.html           목록에 정적 폴백 주입 (JS 꺼진 환경 / 크롤러용)
     5) sitemap.xml           위 전부 + 고정 페이지

   왜 필요한가
     공지와 가이드가 JS 로만 렌더링되면 크롤러에게는 빈 페이지입니다.
     애드센스·검색 모두 "정적 HTML 에 본문이 있는가" 를 봅니다.

   실행
     node tools/build.mjs

   주의
     여기서 생성되는 파일은 직접 고치지 마세요. 다음 실행에서 덮어씁니다.
     공지 내용은 assets/js/notices-data.js,
     가이드 내용은 content/guides/*.html 를 고치고 다시 실행하세요.
   ============================================================= */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.wonderplant.xyz';
const BRAND = '주식회사 원더플랜트';

/* 가이드 허브에 묶이는 순서. 여기 없는 분류는 뒤에 붙습니다. */
const CATEGORY_ORDER = ['반려동물 이동', '반려동물과 사는 일', '아이 습관과 보상'];

/* ---------- 유틸 ---------- */

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const stripTags = (html) =>
  String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

const formatDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
};

const formatDot = (iso) => iso.replace(/-/g, '.');

/* 본문 글자수로 읽는 시간 추정 (한국어 분당 ~500자) */
const readingMinutes = (html) =>
  Math.max(2, Math.round(stripTags(html).length / 500));

/* ---------- 공통 페이지 껍데기 ---------- */

const AD_SCRIPT =
  '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4027922554785589"\n     crossorigin="anonymous"></script>';

/**
 * @param {object} o
 * @param {string} o.slug      산출물 파일명 (예: guide-foo.html)
 * @param {string} o.title     <title> 및 og:title 앞부분
 * @param {string} o.desc      meta description
 * @param {string} o.body      <main> 안쪽 HTML
 * @param {boolean} [o.ads]    애드센스 스크립트 포함 여부
 * @param {string} [o.jsonLd]  JSON-LD 문자열
 * @param {string[]} [o.scripts] 추가 스크립트 경로
 */
function page(o) {
  const url = `${SITE}/${o.slug}`;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(o.title)} | ${BRAND}</title>
<meta name="description" content="${esc(o.desc)}">
<meta name="theme-color" content="#00A97F">
<link rel="icon" href="assets/img/favicon.ico" sizes="any">
<link rel="icon" href="assets/img/favicon-32.png" type="image/png" sizes="32x32">
<link rel="icon" href="assets/img/favicon-512.png" type="image/png" sizes="512x512">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow">
<meta property="og:url" content="${url}">
<meta property="og:type" content="${o.ogType || 'website'}">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
${o.jsonLd ? `<script type="application/ld+json">\n${o.jsonLd}\n</script>` : ''}
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="assets/css/style.css">
${o.ads ? AD_SCRIPT : ''}
</head>
<body>
<a class="skip-link" href="#main">본문 바로가기</a>

<!-- 헤더 · 모바일 드로어 — assets/js/layout.js 가 생성합니다 -->
<div id="site-header"></div>

<main id="main">
${o.body}
</main>

<!-- 푸터 — assets/js/layout.js 가 생성합니다 -->
<div id="site-footer"></div>

<script src="assets/js/site-config.js" defer></script>
<script src="assets/js/layout.js" defer></script>
<script src="assets/js/main.js" defer></script>
${(o.scripts || []).map((s) => `<script src="${s}" defer></script>`).join('\n')}
</body>
</html>
`;
}

/* ---------- 1. 공지 데이터 읽기 ---------- */

function loadNotices() {
  const src = readFileSync(join(ROOT, 'assets/js/notices-data.js'), 'utf8');
  // 사이트가 직접 관리하는 신뢰된 파일이므로 그대로 평가한다.
  const fn = new Function(`${src}; return WP_NOTICES;`);
  return fn()
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/* ---------- 2. 가이드 데이터 읽기 ---------- */

function loadGuides() {
  const dir = join(ROOT, 'content/guides');
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.html'))
    .map((f) => {
      const raw = readFileSync(join(dir, f), 'utf8');
      const m = raw.match(/<!--meta\s*([\s\S]*?)\s*meta-->/);
      if (!m) throw new Error(`${f}: <!--meta ... meta--> 블록이 없습니다`);

      let meta;
      try {
        meta = JSON.parse(m[1]);
      } catch (e) {
        throw new Error(`${f}: meta 블록의 JSON 이 깨졌습니다 — ${e.message}`);
      }

      const body = raw.slice(m.index + m[0].length).trim();
      for (const k of ['title', 'description', 'category', 'date']) {
        if (!meta[k]) throw new Error(`${f}: meta.${k} 가 없습니다`);
      }

      return {
        ...meta,
        slug: basename(f, '.html'),
        body,
        minutes: meta.minutes || readingMinutes(body),
      };
    })
    .sort((a, b) => {
      const ca = CATEGORY_ORDER.indexOf(a.category);
      const cb = CATEGORY_ORDER.indexOf(b.category);
      const ra = ca === -1 ? CATEGORY_ORDER.length : ca;
      const rb = cb === -1 ? CATEGORY_ORDER.length : cb;
      if (ra !== rb) return ra - rb;
      if ((a.order || 99) !== (b.order || 99)) return (a.order || 99) - (b.order || 99);
      return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
    });
}

/* ---------- 3. 공지 상세 페이지 ---------- */

function buildNoticePages(notices) {
  notices.forEach((n, i) => {
    // 배열은 최신순 → i-1 이 더 새 글, i+1 이 더 옛 글
    const next = notices[i - 1];
    const prev = notices[i + 1];

    const navRow = (label, item) =>
      item
        ? `<a class="notice-nav__item" href="notice-${esc(item.id)}.html">` +
          `<span class="notice-nav__dir">${label}</span>` +
          `<span class="t">${esc(item.title)}</span></a>`
        : `<div class="notice-nav__item is-empty">` +
          `<span class="notice-nav__dir">${label}</span>` +
          `<span class="t">${label}이 없습니다</span></div>`;

    const desc = n.excerpt || stripTags(n.body).slice(0, 140);

    const jsonLd = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: n.title,
        datePublished: n.date,
        dateModified: n.date,
        description: desc,
        mainEntityOfPage: `${SITE}/notice-${n.id}.html`,
        author: { '@type': 'Organization', name: BRAND },
        publisher: { '@type': 'Organization', name: BRAND },
      },
      null,
      2
    );

    const body = `
  <section class="section" style="padding-top:calc(var(--header-h) + 48px)">
    <div class="container container--narrow">

      <nav class="breadcrumb" style="margin-bottom:28px" aria-label="현재 위치">
        <a href="index.html">홈</a><span aria-hidden="true">›</span>
        <a href="notice.html">공지사항</a><span aria-hidden="true">›</span>
        <span>${esc(n.category)}</span>
      </nav>

      <article>
        <header class="notice-detail__head">
          <div class="notice-detail__meta">
            <span class="notice-item__cat" data-cat="${esc(n.category)}">${esc(n.category)}</span>
            <time class="tiny" datetime="${esc(n.date)}">${formatDate(n.date)}</time>
          </div>
          <h1 class="h-2">${esc(n.title)}</h1>
        </header>
        <div class="notice-detail__body">
${n.body}
        </div>
      </article>

      <nav class="notice-nav" aria-label="이전 다음 글">
${navRow('다음 글', next)}
${navRow('이전 글', prev)}
      </nav>

      <div style="margin-top:40px;text-align:center">
        <a class="btn btn--ghost" href="notice.html">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
          목록으로 돌아가기
        </a>
      </div>

    </div>
  </section>`;

    writeFileSync(
      join(ROOT, `notice-${n.id}.html`),
      page({
        slug: `notice-${n.id}.html`,
        title: n.title,
        desc,
        body,
        ads: true,
        ogType: 'article',
        jsonLd,
      }),
      'utf8'
    );
  });

  console.log(`  공지 상세 ${notices.length}개`);
}

/* ---------- 4. 공지 목록에 정적 폴백 주입 ---------- */

function injectNoticeList(notices) {
  const file = join(ROOT, 'notice.html');
  let html = readFileSync(file, 'utf8');

  const items = notices
    .map(
      (n) =>
        `        <a class="notice-item" href="notice-${esc(n.id)}.html">` +
        `<span class="notice-item__cat" data-cat="${esc(n.category)}">${esc(n.category)}</span>` +
        `<div><div class="notice-item__title"><span class="notice-item__text">${esc(n.title)}</span></div>` +
        (n.excerpt
          ? `<p class="notice-item__excerpt">${esc(n.excerpt)}</p>`
          : '') +
        `</div>` +
        `<time class="notice-item__date" datetime="${esc(n.date)}">${formatDot(n.date)}</time></a>`
    )
    .join('\n');

  // notice-list.js 가 로드되면 이 블록을 지우고 다시 그린다.
  const block =
    `<div class="notice-list" id="notice-list" aria-live="polite">\n` +
    `        <!-- BUILD:LIST — tools/build.mjs 가 생성합니다. 직접 고치지 마세요. -->\n` +
    `${items}\n` +
    `      </div>`;

  const re = /<div class="notice-list" id="notice-list"[\s\S]*?<\/div>\n\s*<nav class="pagination"/;
  if (!re.test(html)) {
    throw new Error('notice.html 에서 #notice-list 블록을 찾지 못했습니다');
  }
  html = html.replace(re, `${block}\n      <nav class="pagination"`);

  // 건수도 정적으로 박아 둔다 (JS 가 다시 계산한다)
  html = html.replace(
    /<strong id="notice-count">\d*<\/strong>/,
    `<strong id="notice-count">${notices.length}</strong>`
  );

  writeFileSync(file, html, 'utf8');
  console.log('  notice.html 정적 목록 주입');
}

/* ---------- 5. 가이드 본문 페이지 ---------- */

function buildGuidePages(guides) {
  const bySlug = new Map(guides.map((g) => [g.slug, g]));

  guides.forEach((g) => {
    const related = (g.related || [])
      .map((s) => bySlug.get(s))
      .filter(Boolean)
      .slice(0, 3);

    const jsonLd = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: g.title,
        description: g.description,
        datePublished: g.date,
        dateModified: g.updated || g.date,
        inLanguage: 'ko',
        articleSection: g.category,
        mainEntityOfPage: `${SITE}/guide-${g.slug}.html`,
        author: { '@type': 'Organization', name: BRAND },
        publisher: { '@type': 'Organization', name: BRAND },
      },
      null,
      2
    );

    const relatedHtml = related.length
      ? `
      <aside class="guide-related" aria-label="함께 읽으면 좋은 글">
        <h2 class="guide-related__title">함께 읽으면 좋은 글</h2>
        <div class="guide-related__list">
${related
  .map(
    (r) =>
      `          <a class="guide-related__item" href="guide-${esc(r.slug)}.html">` +
      `<span class="guide-related__cat">${esc(r.category)}</span>` +
      `<span class="guide-related__name">${esc(r.title)}</span></a>`
  )
  .join('\n')}
        </div>
      </aside>`
      : '';

    const body = `
  <section class="section" style="padding-top:calc(var(--header-h) + 48px)">
    <div class="container container--narrow">

      <nav class="breadcrumb" style="margin-bottom:28px" aria-label="현재 위치">
        <a href="index.html">홈</a><span aria-hidden="true">›</span>
        <a href="guide.html">가이드</a><span aria-hidden="true">›</span>
        <span>${esc(g.category)}</span>
      </nav>

      <article>
        <header class="notice-detail__head">
          <div class="notice-detail__meta">
            <span class="guide-chip">${esc(g.category)}</span>
            <time class="tiny" datetime="${esc(g.updated || g.date)}">${formatDate(g.updated || g.date)}</time>
            <span class="tiny">· 약 ${g.minutes}분</span>
          </div>
          <h1 class="h-2">${esc(g.title)}</h1>
          <p class="lead" style="margin-top:16px">${esc(g.description)}</p>
        </header>

        <div class="notice-detail__body prose">
${g.body}
        </div>
      </article>
${relatedHtml}

      <div style="margin-top:40px;text-align:center">
        <a class="btn btn--ghost" href="guide.html">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
          가이드 목록으로
        </a>
      </div>

    </div>
  </section>`;

    writeFileSync(
      join(ROOT, `guide-${g.slug}.html`),
      page({
        slug: `guide-${g.slug}.html`,
        title: g.title,
        desc: g.description,
        body,
        ads: true,
        ogType: 'article',
        jsonLd,
      }),
      'utf8'
    );
  });

  console.log(`  가이드 본문 ${guides.length}개`);
}

/* ---------- 6. 가이드 허브 ---------- */

function buildGuideHub(guides) {
  const cats = [...new Set(guides.map((g) => g.category))];

  const groups = cats
    .map((cat) => {
      const items = guides.filter((g) => g.category === cat);
      return `
      <section class="guide-group" aria-label="${esc(cat)}">
        <h2 class="guide-group__title">${esc(cat)}<span class="guide-group__count">${items.length}</span></h2>
        <div class="guide-cards">
${items
  .map(
    (g) => `          <a class="guide-card" href="guide-${esc(g.slug)}.html">
            <h3 class="guide-card__title">${esc(g.title)}</h3>
            <p class="guide-card__desc">${esc(g.description)}</p>
            <span class="guide-card__meta"><time datetime="${esc(g.updated || g.date)}">${formatDot(g.updated || g.date)}</time> · 약 ${g.minutes}분</span>
          </a>`
  )
  .join('\n')}
        </div>
      </section>`;
    })
    .join('\n');

  const jsonLd = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: '가이드',
      description:
        '반려동물과 이동하는 날, 아이와 습관을 만드는 일. 원더플랜트가 제품을 만들며 정리한 실무 자료입니다.',
      url: `${SITE}/guide.html`,
      hasPart: guides.map((g) => ({
        '@type': 'Article',
        headline: g.title,
        url: `${SITE}/guide-${g.slug}.html`,
      })),
    },
    null,
    2
  );

  const body = `
  <section class="page-hero">
    <div class="container">
      <nav class="breadcrumb" aria-label="현재 위치">
        <a href="index.html">홈</a><span aria-hidden="true">›</span><span>가이드</span>
      </nav>
      <h1 class="h-1">직접 겪어보고 정리한 것들</h1>
      <p class="lead">
        반려동물을 차에 태우는 날, 아이와 습관을 만드는 일.
        제품을 만들며 보호자·기사님·부모님께 가장 많이 들은 질문을 하나씩 정리했습니다.
        광고도 홍보도 아닌, 당장 쓸 수 있는 내용만 담았습니다.
      </p>
    </div>
  </section>

  <section class="section section--tight">
    <div class="container">
${groups}
    </div>
  </section>`;

  writeFileSync(
    join(ROOT, 'guide.html'),
    page({
      slug: 'guide.html',
      title: '가이드',
      desc:
        '반려동물 이동과 아이 습관 만들기에 관한 실용 가이드. 동물병원 가는 날 준비물, 멀미, 이동장 적응, 대중교통 규정, 긍정 강화와 보상 설계를 정리했습니다.',
      body,
      ads: true,
      jsonLd,
    }),
    'utf8'
  );

  console.log('  guide.html 허브');
}

/* ---------- 7. sitemap ---------- */

function buildSitemap(notices, guides) {
  // UTC 로 찍으면 한국 시간 기준으로 하루 이전이 나올 수 있어 로컬 날짜를 쓴다.
  const n = new Date();
  const today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;

  const fixed = [
    ['', '1.0'],
    ['guide.html', '0.9'],
    ['about.html', '0.7'],
    ['platform-nebalson.html', '0.8'],
    ['platform-familyquest.html', '0.8'],
    ['pricing.html', '0.8'],
    ['notice.html', '0.6'],
    ['contact.html', '0.5'],
    ['terms.html', '0.3'],
    ['operation.html', '0.3'],
    ['privacy.html', '0.3'],
  ];

  const urls = [
    ...fixed.map(
      ([p, pr]) =>
        `  <url><loc>${SITE}/${p}</loc><lastmod>${today}</lastmod><priority>${pr}</priority></url>`
    ),
    ...guides.map(
      (g) =>
        `  <url><loc>${SITE}/guide-${g.slug}.html</loc><lastmod>${g.updated || g.date}</lastmod><priority>0.9</priority></url>`
    ),
    ...notices.map(
      (n) =>
        `  <url><loc>${SITE}/notice-${n.id}.html</loc><lastmod>${n.date}</lastmod><priority>0.6</priority></url>`
    ),
  ];

  writeFileSync(
    join(ROOT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${urls.join('\n')}\n` +
      `</urlset>\n`,
    'utf8'
  );

  console.log(`  sitemap.xml ${urls.length}개 URL`);
}

/* ---------- 실행 ---------- */

const notices = loadNotices();
const guides = loadGuides();

console.log('정적 페이지 생성');
buildNoticePages(notices);
injectNoticeList(notices);
buildGuidePages(guides);
buildGuideHub(guides);
buildSitemap(notices, guides);
console.log('완료');
