/* =============================================================
   주식회사 원더플랜트 — 공통 스크립트
   의존성 없음 (Vanilla JS). 모든 페이지에서 defer 로드.
   ============================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 헤더 스크롤 상태 ---------- */
  function initHeader() {
    var header = document.querySelector('.header');
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  /* ---------- 2. 모바일 드로어 ---------- */
  function initDrawer() {
    var toggle = document.querySelector('.nav-toggle');
    var drawer = document.getElementById('drawer');
    if (!toggle || !drawer) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('is-locked', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // 데스크톱 폭으로 넓어지면 드로어를 닫아 body 잠금이 남지 않게 한다.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) setOpen(false);
    });

    setOpen(false);
  }

  /* ---------- 3. 현재 페이지 네비 활성화 ---------- */
  function initActiveNav() {
    var here = location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('[data-nav]');
    for (var i = 0; i < links.length; i++) {
      var target = links[i].getAttribute('data-nav');
      // 공지 상세는 공지사항 메뉴를 활성 상태로 유지한다.
      var match = target === here ||
        (target === 'notice.html' && here === 'notice-detail.html');
      if (match) links[i].classList.add('is-active');
    }
  }

  /* ---------- 4. 스크롤 리빌 ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
        setTimeout(function () { el.classList.add('is-in'); }, delay);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  /* ---------- 5. 숫자 카운트업 ---------- */
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

      if (reduceMotion) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }

      var duration = 1400;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var value = target * eased;
        el.textContent = prefix +
          value.toLocaleString('ko-KR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          }) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < counters.length; i++) run(counters[i]);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    for (var k = 0; k < counters.length; k++) io.observe(counters[k]);
  }

  /* ---------- 6. 올해 연도 ---------- */
  function initYear() {
    var nodes = document.querySelectorAll('[data-year]');
    var y = String(new Date().getFullYear());
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = y;
  }

  /* ---------- 7. 문의 폼 (백엔드 없음 → 메일 클라이언트로 전달) ---------- */
  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var status = document.getElementById('form-status');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var data = new FormData(form);
      var to = form.getAttribute('data-mailto') || '';
      var subject = '[홈페이지 문의] ' + (data.get('subject') || '문의') +
        ' - ' + (data.get('name') || '');

      var body = [
        '■ 문의 유형 : ' + (data.get('subject') || ''),
        '■ 이름      : ' + (data.get('name') || ''),
        '■ 회사/소속 : ' + (data.get('company') || '-'),
        '■ 이메일    : ' + (data.get('email') || ''),
        '■ 연락처    : ' + (data.get('phone') || '-'),
        '',
        '■ 문의 내용',
        String(data.get('message') || '')
      ].join('\n');

      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      if (status) {
        status.hidden = false;
        status.textContent =
          '메일 작성 창을 열었습니다. 창이 열리지 않으면 ' + to + ' 로 직접 보내주세요.';
      }
    });
  }

  /* ---------- 초기화 ---------- */
  function boot() {
    initHeader();
    initDrawer();
    initActiveNav();
    initReveal();
    initCounters();
    initYear();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
