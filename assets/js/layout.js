/* =============================================================
   공통 레이아웃 렌더러 — 헤더 · 모바일 드로어 · 푸터
   -------------------------------------------------------------
   site-config.js (WP_SITE) 를 읽어 아래 자리표시자를 채웁니다.

     <div id="site-header"></div>   → 헤더 + 모바일 드로어
     <div id="site-footer"></div>   → 푸터

   페이지별로 드로어 하단 버튼을 바꾸려면 자리표시자에 속성을 붙입니다.
     <div id="site-header" data-cta="드라이버 베타 신청하기" data-cta-href="contact.html"></div>

   ⚠️ 로드 순서: site-config.js → layout.js → main.js
      (셋 다 defer 로 넣으면 이 순서가 보장됩니다. layout.js 가 만든 DOM 을
       main.js 가 찾아 이벤트를 붙이므로 순서가 바뀌면 메뉴가 동작하지 않습니다.)
   ============================================================= */
(function () {
  'use strict';

  var S = window.WP_SITE;
  if (!S) return;

  var C = S.company;
  var MAILTO = 'mailto:' + C.email;

  /* 사용자가 넣은 값이 마크업으로 새지 않도록 이스케이프한다. */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* site-config.js 의 문의 그룹에서 쓰는 치환 토큰 */
  function resolve(v) {
    if (v === '__EMAIL__') return C.email;
    if (v === '__MAILTO__') return MAILTO;
    return v;
  }

  function logo(extraClass) {
    return '<a class="logo' + (extraClass ? ' ' + extraClass : '') + '" href="index.html" aria-label="' + esc(C.logoKo) + ' 홈">' +
      '<img class="logo__mark" src="assets/img/logo-mark.png" alt="" width="32" height="32">' +
      '<span class="logo__text">' + esc(C.logoKo) + '<small>' + esc(C.logoEn) + '</small></span>' +
      '</a>';
  }

  /* 하위메뉴가 있는 상단 메뉴에 붙는 꺾쇠 */
  function caret() {
    return '<svg class="nav__caret" viewBox="0 0 10 6" aria-hidden="true" focusable="false">' +
      '<path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" ' +
      'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  /* 하위메뉴 링크의 data-nav.
     main.js 의 현재 페이지 활성화는 data-nav 를 '현재 파일명'과 비교하므로,
     같은 페이지 안의 앵커(about.html#values)에 붙이면 그 페이지의 하위메뉴가
     전부 활성 상태가 된다. 그래서 # 가 없는 '독립 페이지' 항목에만 붙인다. */
  function navAttr(href) {
    return String(href).indexOf('#') === -1 ? ' data-nav="' + esc(href) + '"' : '';
  }

  /* ---------- 헤더 + 드로어 ---------- */
  function renderHeader(mount) {
    var ctaLabel = mount.getAttribute('data-cta') || S.drawerCta.label;
    var ctaHref = mount.getAttribute('data-cta-href') || S.drawerCta.href;

    var navLinks = S.nav.map(function (n, i) {
      var subs = n.sections || [];
      if (!subs.length) {
        return '<div class="nav__item">' +
          '<a class="nav__link" data-nav="' + esc(n.href) + '" href="' + esc(n.href) + '">' + esc(n.label) + '</a>' +
          '</div>';
      }
      var panelId = 'subnav-' + i;
      return '<div class="nav__item nav__item--has-sub">' +
        '<a class="nav__link nav__link--parent" data-nav="' + esc(n.href) + '" href="' + esc(n.href) + '"' +
          ' aria-describedby="' + panelId + '">' +
          esc(n.label) + caret() +
        '</a>' +
        '<div class="subnav" id="' + panelId + '">' +
          '<div class="subnav__inner">' +
            subs.map(function (s) {
              return '<a class="subnav__link"' + navAttr(s.href) + ' href="' + esc(s.href) + '">' + esc(s.label) + '</a>';
            }).join('') +
          '</div>' +
        '</div>' +
        '</div>';
    }).join('');

    var drawerLinks = S.nav.map(function (n) {
      var html = '<a class="drawer__link" data-nav="' + esc(n.href) + '" href="' + esc(n.href) + '">' + esc(n.label) + '</a>';
      var subs = n.sections || [];
      if (subs.length) {
        html += '<div class="drawer__sub">' +
          subs.map(function (s) {
            return '<a class="drawer__sublink"' + navAttr(s.href) + ' href="' + esc(s.href) + '">' + esc(s.label) + '</a>';
          }).join('') +
          '</div>';
      }
      return html;
    }).concat([
      '<a class="drawer__link" data-nav="' + esc(S.headerCta.href) + '" href="' + esc(S.headerCta.href) + '">' +
        esc(S.headerCta.label) + '</a>'
    ]).join('');

    mount.innerHTML =
      '<header class="header">' +
        '<div class="container header__inner">' +
          logo() +
          '<nav class="nav" aria-label="주요 메뉴">' + navLinks + '</nav>' +
          '<div class="header__actions">' +
            '<a class="btn btn--primary btn--sm" href="' + esc(S.headerCta.href) + '">' + esc(S.headerCta.label) + '</a>' +
            '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="drawer" aria-label="메뉴 열기">' +
              '<span class="nav-toggle__bars" aria-hidden="true"><span></span><span></span><span></span></span>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</header>' +
      '<div class="drawer" id="drawer" aria-hidden="true">' +
        '<nav aria-label="모바일 메뉴">' + drawerLinks + '</nav>' +
        '<div class="drawer__cta">' +
          '<a class="btn btn--primary btn--block btn--lg" href="' + esc(ctaHref) + '">' + esc(ctaLabel) + '</a>' +
        '</div>' +
      '</div>';
  }

  /* ---------- 푸터 ---------- */
  function renderFooter(mount) {
    var groups = S.footerGroups.map(function (g) {
      var links = g.links.map(function (l) {
        return '<li><a href="' + esc(resolve(l.href)) + '">' + esc(resolve(l.label)) + '</a></li>';
      }).join('');
      return '<div><h4>' + esc(g.title) + '</h4><ul class="footer__links">' + links + '</ul></div>';
    }).join('');

    var policy = (S.footerPolicy || []).map(function (l) {
      return '<a href="' + esc(l.href) + '">' + esc(l.label) + '</a>';
    }).join('');

    mount.innerHTML =
      '<footer class="footer">' +
        '<div class="container">' +
          '<div class="footer__grid">' +
            '<div>' + logo() +
              // description 은 <br> 을 살려야 해서 그대로 넣는다(사이트가 직접 관리하는 값).
              '<p class="footer__desc">' + C.description + '</p>' +
            '</div>' +
            groups +
          '</div>' +
          '<div class="footer__bottom">' +
            '<div class="footer__legal">' +
              '<span>' + esc(C.nameKo) + '</span>' +
              '<span>대표이사 ' + esc(C.ceo) + '</span>' +
              '<span>사업자등록번호 ' + esc(C.bizNo) + '</span>' +
              '<span>통신판매업 신고번호 ' + esc(C.retailNo) + '</span>' +
              '<span>' + esc(C.address) + '</span>' +
            '</div>' +
            '<div class="footer__policy">' + policy + '</div>' +
            '<div>© <span data-year>' + new Date().getFullYear() + '</span> ' + esc(C.nameEn) + ' All rights reserved.</div>' +
          '</div>' +
        '</div>' +
      '</footer>';
  }

  var header = document.getElementById('site-header');
  var footer = document.getElementById('site-footer');
  if (header) renderHeader(header);
  if (footer) renderFooter(footer);
})();
