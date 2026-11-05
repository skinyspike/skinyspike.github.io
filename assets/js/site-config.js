/* =============================================================
   사이트 공통 설정 — 헤더 / 드로어 / 푸터의 단일 소스
   -------------------------------------------------------------
   회사 정보나 메뉴를 바꿀 때는 이 파일 한 곳만 고치면
   모든 페이지에 동시에 반영됩니다. (실제 마크업은 layout.js 가 만듭니다)
   ============================================================= */

var WP_SITE = {

  /* ---------- 회사 정보 ---------- */
  company: {
    nameKo: '주식회사 원더플랜트',
    nameEn: 'WonderPlant Inc.',
    logoKo: '원더플랜트',
    logoEn: 'WONDERPLANT',
    ceo: '정수환',
    bizNo: '394-81-04083',
    retailNo: '2026-경기김포-6414',
    address: '경기도 김포시 돌문로 50-20 로얄프라자 502-C18호',
    email: 'admin@wonderplant.xyz',
    // 푸터 소개 문구 (<br> 사용 가능)
    description:
      '일상의 불편을 딛고, 놀라운 경험을 키웁니다.<br>' +
      '반려동물 이동 플랫폼 「네발손님」과 동기부여 할일 앱 「패밀리 퀘스트」를 만들고 있습니다.'
  },

  /* ---------- 상단 메뉴 (헤더 + 모바일 드로어 공용) ---------- */
  /* sections 를 두면 그 메뉴에 하위메뉴가 생깁니다.
       · 'about.html#values' 처럼 # 가 붙은 항목 → 그 페이지의 해당 섹션으로 스크롤
       · 'pricing.html' 처럼 # 가 없는 항목     → 독립 페이지로 이동
     앵커(#)는 각 페이지 <section> 의 id 와 1:1 로 맞춰야 합니다 — id 를 지우거나
     바꾸면 하위메뉴가 엉뚱한 곳으로 갑니다. sections 를 생략하면 지금까지처럼
     하위메뉴 없는 단일 링크가 됩니다. */
  nav: [
    {
      label: '회사소개', href: 'about.html',
      sections: [
        { label: '우리가 하는 일', href: 'about.html#mission' },
        { label: '풀고 있는 문제', href: 'about.html#problems' },
        { label: '일하는 방식', href: 'about.html#values' },
        { label: '걸어온 길', href: 'about.html#history' },
        { label: '회사 정보', href: 'about.html#company' }
      ]
    },
    {
      label: '네발손님', href: 'platform-nebalson.html',
      sections: [
        { label: '기사님이 겪는 세 가지', href: 'platform-nebalson.html#problems' },
        { label: '네발손님이 바꾸는 것', href: 'platform-nebalson.html#features' },
        { label: '무엇이 달라지나요', href: 'platform-nebalson.html#compare' },
        { label: '보호자에게 좋은 이유', href: 'platform-nebalson.html#guardian' },
        { label: '기사님 베타 신청', href: 'platform-nebalson.html#beta' },
        { label: '요금 안내', href: 'pricing.html' }
      ]
    },
    {
      label: '패밀리 퀘스트', href: 'platform-familyquest.html',
      sections: [
        { label: '왜 사흘 만에 방치될까요', href: 'platform-familyquest.html#problems' },
        { label: '한 바퀴가 도는 방식', href: 'platform-familyquest.html#how' },
        { label: '재미가 먼저입니다', href: 'platform-familyquest.html#features' },
        { label: '이런 분들께 권합니다', href: 'platform-familyquest.html#who' },
        { label: '가족 베타 신청', href: 'platform-familyquest.html#beta' }
      ]
    },
    {
      label: '가이드', href: 'guide.html',
      sections: [
        { label: '동물병원 가는 날 준비물', href: 'guide-pet-hospital-checklist.html' },
        { label: '멀미인지 불안인지 가리기', href: 'guide-pet-car-sickness.html' },
        { label: '이동장 적응 2주 훈련', href: 'guide-pet-carrier-training.html' },
        { label: '펫택시 요금이 매겨지는 방식', href: 'guide-pet-taxi-fare.html' },
        { label: '대중교통 동반 규정', href: 'guide-pet-public-transport.html' },
        { label: '전체 가이드 보기', href: 'guide.html' }
      ]
    },
    { label: '공지사항', href: 'notice.html' }
  ],

  /* 헤더 우측 버튼 (모바일 드로어 맨 아래에도 같은 항목이 들어갑니다) */
  headerCta: { label: '문의하기', href: 'contact.html' },

  /* 드로어 하단 큰 버튼의 기본값.
     페이지별로 다르게 하려면 해당 페이지의 <div id="site-header"> 에
     data-cta="라벨" data-cta-href="주소" 를 붙이면 됩니다. */
  drawerCta: { label: '제휴·도입 문의하기', href: 'contact.html' },

  /* 푸터 하단 약관 링크 */
  footerPolicy: [
    { label: '이용약관', href: 'terms.html' },
    { label: '운영정책', href: 'operation.html' },
    { label: '개인정보처리방침', href: 'privacy.html' }
  ],

  /* ---------- 푸터 링크 ---------- */
  /* 채용 메뉴를 다시 열려면 '회사' 그룹에 아래 항목을 추가하세요.
     { label: '채용', href: 'notice.html?cat=%EC%B1%84%EC%9A%A9' } */
  footerGroups: [
    {
      title: '회사',
      links: [
        { label: '회사소개', href: 'about.html' },
        { label: '일하는 방식', href: 'about.html#values' },
        { label: '공지사항', href: 'notice.html' }
      ]
    },
    {
      title: '플랫폼',
      links: [
        { label: '네발손님 (펫택시)', href: 'platform-nebalson.html' },
        { label: '네발손님 요금 안내', href: 'pricing.html' },
        { label: '패밀리 퀘스트', href: 'platform-familyquest.html' }
      ]
    },
    {
      title: '가이드',
      links: [
        { label: '동물병원 가는 날 준비물', href: 'guide-pet-hospital-checklist.html' },
        { label: '차에서 토하는 아이', href: 'guide-pet-car-sickness.html' },
        { label: '이동장 적응 2주 훈련', href: 'guide-pet-carrier-training.html' },
        { label: '장거리 이동 타임라인', href: 'guide-pet-long-distance.html' },
        { label: '펫택시 요금 구조', href: 'guide-pet-taxi-fare.html' },
        { label: '대중교통 동반 규정', href: 'guide-pet-public-transport.html' },
        { label: '아이 습관과 보상', href: 'guide-habit-two-weeks.html' },
        { label: '전체 보기', href: 'guide.html' }
      ]
    },
    {
      title: '문의',
      links: [
        { label: '__EMAIL__', href: '__MAILTO__' },
        { label: '문의 폼 바로가기', href: 'contact.html' }
      ]
    }
  ]
};
