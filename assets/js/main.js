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

  // 계정·데이터 삭제 문의 유형 → 안내 박스에 표시할 서비스명
  var DELETION_SUBJECTS = {
    '네발손님 계정 및 데이터 삭제': '네발손님',
    '패밀리 퀘스트 계정 및 데이터 삭제': '패밀리 퀘스트'
  };

  var DELETION_PLACEHOLDER =
    '본인 확인을 위해 가입 시 사용한 이름, 이메일 또는 휴대전화번호, ' +
    '로그인 수단(구글·네이버·카카오)을 적어주세요. 함께 전달할 내용이 있으면 이어서 작성해 주세요.';

  /* 삭제 요청 안내 박스: 유형에 따라 표시/숨김 전환.
     숨김 상태에서는 disabled 로 두어 유효성 검사 대상에서 제외한다.
     반환값은 체크된 확인 항목 목록을 돌려주는 함수. */
  function initDeletionNotice(form) {
    var notice = document.getElementById('deletion-notice');
    var subject = form.querySelector('[name="subject"]');
    if (!notice || !subject) return function () { return []; };

    var checks = notice.querySelectorAll('input[type="checkbox"]');
    var labels = notice.querySelectorAll('[data-deletion-service]');
    var message = form.querySelector('[name="message"]');
    var basePlaceholder = message ? (message.getAttribute('placeholder') || '') : '';

    function sync() {
      var service = DELETION_SUBJECTS[subject.value] || '';
      var on = !!service;

      notice.hidden = !on;
      for (var i = 0; i < checks.length; i++) {
        checks[i].required = on;
        checks[i].disabled = !on;
        if (!on) checks[i].checked = false;
      }
      for (var j = 0; j < labels.length; j++) {
        labels[j].textContent = service || '서비스';
      }
      if (message) {
        message.setAttribute('placeholder', on ? DELETION_PLACEHOLDER : basePlaceholder);
      }
    }

    subject.addEventListener('change', sync);
    sync();

    return function collect() {
      if (notice.hidden) return [];
      var acks = [];
      for (var i = 0; i < checks.length; i++) {
        if (checks[i].checked) acks.push(checks[i].getAttribute('data-ack') || '확인');
      }
      return acks;
    };
  }

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var status = document.getElementById('form-status');
    var collectDeletionAcks = initDeletionNotice(form);

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
      ];

      var acks = collectDeletionAcks();
      if (acks.length) {
        body.push('', '■ 삭제 요청 확인 사항 (모두 동의)');
        for (var i = 0; i < acks.length; i++) body.push('- ' + acks[i]);
      }
      body = body.join('\n');

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
