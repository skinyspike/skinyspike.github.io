# 주식회사 원더플랜트 — 공식 홈페이지

빌드 도구 없는 **순수 정적 사이트**(HTML5 / CSS3 / Vanilla JS)입니다.
GitHub Pages에 그대로 올리면 바로 동작합니다. npm, 번들러, 프레임워크 모두 필요 없습니다.

---

## 파일 구조

```
.
├── index.html                    홈
├── about.html                    회사소개 (미션 · 문제 · 가치 · 연혁 · 회사정보)
├── platform-nebalson.html        네발손님 (펫택시 플랫폼)
├── platform-familyquest.html     패밀리 퀘스트 (동기부여 할일 앱)
├── notice.html                   공지사항 목록 (카테고리 · 검색 · 페이지네이션)
├── notice-detail.html            공지사항 상세 (?id=...)
├── contact.html                  문의하기
├── 404.html                      404 페이지
├── robots.txt
├── .nojekyll                     GitHub Pages의 Jekyll 처리 비활성화
└── assets/
    ├── css/style.css             전체 스타일 (디자인 토큰 · 반응형 · 다크 미대응 단일 테마)
    ├── img/favicon.svg           로고 / 파비콘
    └── js/
        ├── main.js               헤더 · 모바일 드로어 · 스크롤 리빌 · 카운트업 · 문의 폼
        ├── notices-data.js       ★ 공지사항 데이터 (여기만 고치면 됩니다)
        ├── notice-list.js        목록 렌더링 · 필터 · 검색 · 페이지네이션
        └── notice-detail.js      상세 렌더링 · 이전/다음 글
```

---

## 로컬에서 보기

`index.html`을 브라우저로 바로 열어도 동작합니다(공지 데이터를 `fetch`가 아니라
JS 파일로 넣었기 때문에 `file://`에서도 깨지지 않습니다).

로컬 서버로 띄우고 싶다면:

```bash
python -m http.server 8000
```

---

## GitHub Pages 배포

### 1) 사용자/조직 사이트 (`계정명.github.io`)

저장소 이름을 `계정명.github.io` 로 만들고 이 폴더 내용을 push 하면 끝입니다.

```bash
git add -A
git commit -m "feat: 원더플랜트 홈페이지"
git push origin main
```

GitHub 저장소 → **Settings → Pages → Source: Deploy from a branch → main / (root)**

### 2) 프로젝트 사이트 (`계정명.github.io/저장소명/`)

동일하게 push 후 Pages 설정을 하면 되지만, **`404.html` 안의 경로만** 수정해야 합니다.
`404.html`은 어느 깊이에서든 열릴 수 있어 루트 절대경로(`/assets/...`)를 쓰고 있는데,
프로젝트 사이트에서는 앞에 저장소 이름이 붙어야 합니다.

```html
<!-- 예: 저장소명이 wonderplant_home 인 경우 -->
<link rel="stylesheet" href="/wonderplant_home/assets/css/style.css">
<a class="btn btn--primary btn--lg" href="/wonderplant_home/">홈으로 가기</a>
```

나머지 페이지는 전부 상대경로라 그대로 동작합니다.

### 3) 커스텀 도메인

`CNAME` 파일을 루트에 만들고 도메인만 한 줄 적으면 됩니다.

---

## 공지사항 글 올리기

`assets/js/notices-data.js` **한 파일만** 고치면 됩니다. 배열 맨 앞에 객체를 추가하세요.

```js
var WP_NOTICES = [
  {
    id: 'unique-slug',          // URL 에 쓰입니다: notice-detail.html?id=unique-slug
    category: '공지',            // 공지 | 보도자료 | 업데이트 | 채용
    title: '제목',
    date: '2026-09-01',          // YYYY-MM-DD
    pinned: false,               // true 면 목록 최상단 고정 (선택)
    excerpt: '목록에 보이는 한 줄 요약',
    body: '<p>본문 HTML</p>'     // h3 / p / ul·li / strong / a 사용 가능
  },
  // ...기존 글
];
```

- 작성일이 **최근 14일 이내**면 목록에 자동으로 `NEW` 배지가 붙습니다.
- 카테고리를 추가하려면 `notice.html`의 칩 버튼과 `style.css`의
  `.notice-item__cat[data-cat="..."]` 색상 규칙만 함께 추가하면 됩니다.
- 페이지당 글 수는 `notice-list.js` 상단의 `PER_PAGE` 값입니다(기본 8).

> ⚠️ 현재 들어 있는 11건은 **레이아웃 확인용 샘플**입니다. 실제 공지로 교체하세요.

---

## 반드시 교체해야 할 항목

전체 파일에서 `TODO:` 주석으로 표시해 두었습니다.

| 항목 | 위치 |
|---|---|
| 대표이사명 · 사업자등록번호 · 주소 | 모든 페이지 푸터, `about.html` 회사 정보 |
| 설립일 | `about.html` 회사 정보 · 연혁 |
| 대표 이메일 (`contact@wonderplant.co.kr`) | 모든 페이지 푸터, `contact.html`(`data-mailto` 속성 포함) |
| 연혁 내용 | `about.html` `.timeline` |
| 공지사항 샘플 11건 | `assets/js/notices-data.js` |
| 운영 시간 | `contact.html` |
| 사이트 도메인 | `robots.txt`, 각 페이지의 `<link rel="canonical">` |

---

## 문의 폼에 대하여

정적 사이트라 서버가 없습니다. 현재 문의 폼은 입력값을 정리해
**사용자의 메일 클라이언트를 여는 `mailto:` 방식**으로 동작합니다.

실제 수신함으로 바로 받고 싶다면 아래 중 하나를 붙이면 됩니다(모두 정적 사이트 호환).

- [Formspree](https://formspree.io/) — `<form action="https://formspree.io/f/XXXX" method="POST">` 로 바꾸고
  `contact.html`의 `id="contact-form"`을 제거(또는 `main.js`의 `initContactForm` 비활성화)
- [Getform](https://getform.io/), [Web3Forms](https://web3forms.com/) 등도 동일한 방식
- Google Forms 임베드

---

## 디자인 메모

- **브랜드 컬러** `#00A97F` (딥 민트 그린) — 「네발손님」의 민트(`#00B894`)와
  「패밀리 퀘스트」의 옐로(`#FFD93D`)를 함께 품을 수 있는 중간 톤으로 잡았습니다.
- 두 플랫폼 상세 페이지는 각자의 디자인 시스템 톤을 부분적으로 반영합니다.
  네발손님은 민트 그린, 패밀리 퀘스트는 레트로 아케이드(하드 섀도 · 3px 테두리).
- 모든 색·간격·라운드 값은 `style.css` 상단의 CSS 변수(`:root`)에 모여 있습니다.
- 히어로의 폰 목업은 **이미지가 아니라 CSS**로 그렸습니다. 실제 앱 스크린샷이 준비되면
  `.mockups` 블록을 `<img>` 로 교체하면 됩니다.
- 폰트는 [Pretendard](https://github.com/orioncactus/pretendard) (jsDelivr CDN).
  오프라인 배포가 필요하면 웹폰트를 `assets/fonts/` 에 내려받아 `@font-face` 로 바꾸세요.

## 접근성 / 호환성

- 시맨틱 마크업, `skip-link`, `aria-*` 속성, 키보드 포커스 링(`:focus-visible`)
- `prefers-reduced-motion` 존중 — 애니메이션 비활성화 시 즉시 표시
- 모바일 우선 반응형 (브레이크포인트 1024 / 860 / 640 / 400px)
- JavaScript 없이도 본문·네비게이션은 읽힙니다(공지 목록 제외)
- 최신 Chrome · Edge · Safari · Firefox, iOS Safari · Android Chrome 대응
