/* =============================================================
   공지사항 목록 — 카테고리 필터 · 검색 · 페이지네이션
   notices-data.js (WP_NOTICES) 를 먼저 로드해야 한다.
   ============================================================= */
(function () {
  'use strict';

  var PER_PAGE = 8;
  var NEW_DAYS = 14; // 최근 N일 이내면 NEW 배지

  var listEl = document.getElementById('notice-list');
  var pagerEl = document.getElementById('notice-pagination');
  var countEl = document.getElementById('notice-count');
  var chipsEl = document.getElementById('notice-chips');
  var searchEl = document.getElementById('notice-search');
  if (!listEl) return;

  var all = (window.WP_NOTICES || []).slice().sort(function (a, b) {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  });

  var params = new URLSearchParams(location.search);
  var state = {
    cat: params.get('cat') || '전체',
    q: params.get('q') || '',
    page: Math.max(1, parseInt(params.get('page') || '1', 10) || 1)
  };

  /* ---------- 헬퍼 ---------- */
  function formatDate(iso) {
    var p = iso.split('-');
    return p[0] + '.' + p[1] + '.' + p[2];
  }

  function isNew(iso) {
    var diff = Date.now() - new Date(iso + 'T00:00:00').getTime();
    return diff >= 0 && diff < NEW_DAYS * 86400000;
  }

  function stripTags(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- 필터링 ---------- */
  function filtered() {
    var q = state.q.trim().toLowerCase();
    return all.filter(function (n) {
      if (state.cat !== '전체' && n.category !== state.cat) return false;
      if (!q) return true;
      var hay = (n.title + ' ' + (n.excerpt || '') + ' ' + stripTags(n.body || '')).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  /* ---------- 렌더 ---------- */
  function renderList(items) {
    listEl.innerHTML = '';

    if (!items.length) {
      var empty = el('div', 'empty');
      empty.appendChild(el('strong', null, '검색 결과가 없습니다'));
      empty.appendChild(el('p', null, '다른 검색어나 카테고리로 다시 찾아보세요.'));
      listEl.appendChild(empty);
      return;
    }

    items.forEach(function (n) {
      var a = el('a', 'notice-item');
      a.href = 'notice-detail.html?id=' + encodeURIComponent(n.id);

      var cat = el('span', 'notice-item__cat', n.category);
      cat.setAttribute('data-cat', n.category);

      var main = el('div');
      var title = el('div', 'notice-item__title');
      if (n.pinned) title.appendChild(el('span', 'badge-pin', '고정'));
      // 제목을 span 으로 감싸야 뒤따르는 NEW 배지가 제목 끝에 붙는다(flex 아이템 분리).
      title.appendChild(el('span', 'notice-item__text', n.title));
      if (isNew(n.date)) title.appendChild(el('span', 'badge-new', 'NEW'));
      main.appendChild(title);

      if (n.excerpt) main.appendChild(el('p', 'notice-item__excerpt', n.excerpt));

      var date = el('time', 'notice-item__date', formatDate(n.date));
      date.setAttribute('datetime', n.date);

      a.appendChild(cat);
      a.appendChild(main);
      a.appendChild(date);
      listEl.appendChild(a);
    });
  }

  function renderPager(total) {
    pagerEl.innerHTML = '';
    var pages = Math.ceil(total / PER_PAGE);
    if (pages <= 1) return;

    function pageBtn(label, page, opts) {
      opts = opts || {};
      var b = el('button', opts.on ? 'is-on' : null, label);
      b.type = 'button';
      if (opts.disabled) b.disabled = true;
      if (opts.label) b.setAttribute('aria-label', opts.label);
      if (opts.on) b.setAttribute('aria-current', 'page');
      b.addEventListener('click', function () {
        state.page = page;
        update({ scroll: true });
      });
      return b;
    }

    pagerEl.appendChild(pageBtn('‹', state.page - 1, {
      disabled: state.page === 1, label: '이전 페이지'
    }));

    // 현재 페이지 주변 최대 5개만 노출
    var start = Math.max(1, Math.min(state.page - 2, pages - 4));
    var end = Math.min(pages, start + 4);

    if (start > 1) {
      pagerEl.appendChild(pageBtn('1', 1, {}));
      if (start > 2) pagerEl.appendChild(el('span', 'tiny', '…'));
    }
    for (var i = start; i <= end; i++) {
      pagerEl.appendChild(pageBtn(String(i), i, { on: i === state.page }));
    }
    if (end < pages) {
      if (end < pages - 1) pagerEl.appendChild(el('span', 'tiny', '…'));
      pagerEl.appendChild(pageBtn(String(pages), pages, {}));
    }

    pagerEl.appendChild(pageBtn('›', state.page + 1, {
      disabled: state.page === pages, label: '다음 페이지'
    }));
  }

  function syncUrl() {
    var p = new URLSearchParams();
    if (state.cat !== '전체') p.set('cat', state.cat);
    if (state.q.trim()) p.set('q', state.q.trim());
    if (state.page > 1) p.set('page', String(state.page));
    var qs = p.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  function update(opts) {
    opts = opts || {};
    var items = filtered();
    var pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
    if (state.page > pages) state.page = pages;

    var from = (state.page - 1) * PER_PAGE;
    renderList(items.slice(from, from + PER_PAGE));
    renderPager(items.length);

    if (countEl) countEl.textContent = items.length.toLocaleString('ko-KR');

    if (chipsEl) {
      var chips = chipsEl.querySelectorAll('.chip');
      for (var i = 0; i < chips.length; i++) {
        var on = chips[i].getAttribute('data-cat') === state.cat;
        chips[i].classList.toggle('is-on', on);
        chips[i].setAttribute('aria-pressed', String(on));
      }
    }

    syncUrl();

    if (opts.scroll) {
      var top = listEl.getBoundingClientRect().top + window.scrollY - 140;
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
  }

  /* ---------- 이벤트 ---------- */
  if (chipsEl) {
    chipsEl.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      state.cat = chip.getAttribute('data-cat');
      state.page = 1;
      update();
    });
  }

  if (searchEl) {
    searchEl.value = state.q;
    var timer = null;
    searchEl.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.q = searchEl.value;
        state.page = 1;
        update();
      }, 220);
    });
    // 엔터로 폼이 제출되며 페이지가 새로고침되는 것을 막는다.
    var form = searchEl.closest('form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });
  }

  update();
})();
