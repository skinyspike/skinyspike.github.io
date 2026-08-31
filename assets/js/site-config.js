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
    address: '경기도 김포시 돌문로 50-20 로얄프라자 502-C18호',
    email: 'admin@wonderplant.co.kr',
    // 푸터 소개 문구 (<br> 사용 가능)
    description:
      '일상의 불편을 심어, 놀라운 경험으로 키웁니다.<br>' +
      '반려동물 이동 플랫폼 「네발손님」과 동기부여 할일 앱 「패밀리 퀘스트」를 만들고 있습니다.'
  },

  /* ---------- 상단 메뉴 (헤더 + 모바일 드로어 공용) ---------- */
  nav: [
    { label: '회사소개', href: 'about.html' },
    { label: '네발손님', href: 'platform-nebalson.html' },
    { label: '패밀리 퀘스트', href: 'platform-familyquest.html' },
    { label: '공지사항', href: 'notice.html' }
  ],

  /* 헤더 우측 버튼 (모바일 드로어 맨 아래에도 같은 항목이 들어갑니다) */
  headerCta: { label: '문의하기', href: 'contact.html' },

  /* 드로어 하단 큰 버튼의 기본값.
     페이지별로 다르게 하려면 해당 페이지의 <div id="site-header"> 에
     data-cta="라벨" data-cta-href="주소" 를 붙이면 됩니다. */
  drawerCta: { label: '제휴·도입 문의하기', href: 'contact.html' },

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
        { label: '패밀리 퀘스트', href: 'platform-familyquest.html' }
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
