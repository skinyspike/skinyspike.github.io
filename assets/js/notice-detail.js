/* =============================================================
   공지사항 상세 — ?id=<공지 id> 로 열린다.
   notices-data.js (WP_NOTICES) 를 먼저 로드해야 한다.
   ============================================================= */
(function () {
  'use strict';

  var root = document.getElementById('notice-detail');
  if (!root) return;

  var all = (window.WP_NOTICES || []).slice().sort(function (a, b) {
    return a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
  });

  var id = new URLSearchParams(location.search).get('id');
  var index = -1;
  for (var i = 0; i < all.length; i++) {
    if (all[i].id === id) { index = i; break; }
  }

  function formatDate(iso) {
    var p = iso.split('-');
    return p[0] + '년 ' + Number(p[1]) + '월 ' + Number(p[2]) + '일';
  }

  /* ---------- 없는 글 ---------- */
  if (index === -1) {
    root.innerHTML =
      '<div class="empty">' +
      '<strong>요청하신 게시글을 찾을 수 없습니다</strong>' +
      '<p>주소가 바뀌었거나 삭제된 글일 수 있습니다.</p>' +
      '<p style="margin-top:24px"><a class="btn btn--primary" href="notice.html">공지사항 목록으로</a></p>' +
      '</div>';
    document.title = '게시글을 찾을 수 없습니다 | 주식회사 원더플랜트';
    return;
  }

  var n = all[index];

  document.title = n.title + ' | 주식회사 원더플랜트';
  var desc = document.querySelector('meta[name="description"]');
  if (desc && n.excerpt) desc.setAttribute('content', n.excerpt);

  var crumb = document.getElementById('crumb-current');
  if (crumb) crumb.textContent = n.category;

  /* ---------- 본문 ---------- */
  root.innerHTML =
    '<header class="notice-detail__head">' +
    '<div class="notice-detail__meta">' +
    '<span class="notice-item__cat" data-cat="' + n.category + '"></span>' +
    '<time class="tiny" datetime="' + n.date + '"></time>' +
    '</div>' +
    '<h1 class="h-2" id="notice-title"></h1>' +
    '</header>' +
    '<div class="notice-detail__body" id="notice-body"></div>';

  root.querySelector('.notice-item__cat').textContent = n.category;
  root.querySelector('time').textContent = formatDate(n.date);
  root.querySelector('#notice-title').textContent = n.title;
  // body 는 사이트가 직접 관리하는 신뢰된 HTML 문자열이다.
  root.querySelector('#notice-body').innerHTML = n.body;

  /* ---------- 이전 / 다음 ---------- */
  var nav = document.getElementById('notice-nav');
  if (!nav) return;

  function row(dirLabel, item) {
    if (!item) {
      return '<div class="notice-nav__item is-empty">' +
        '<span class="notice-nav__dir">' + dirLabel + '</span>' +
        '<span class="t">' + (dirLabel === '이전 글' ? '이전 글이 없습니다' : '다음 글이 없습니다') + '</span>' +
        '</div>';
    }
    var a = document.createElement('a');
    a.className = 'notice-nav__item';
    a.href = 'notice-detail.html?id=' + encodeURIComponent(item.id);
    var d = document.createElement('span');
    d.className = 'notice-nav__dir';
    d.textContent = dirLabel;
    var t = document.createElement('span');
    t.className = 't';
    t.textContent = item.title;
    a.appendChild(d);
    a.appendChild(t);
    return a.outerHTML;
  }

  // 배열은 최신순이므로 index-1 이 더 새 글(다음 글), index+1 이 더 옛 글(이전 글)이다.
  nav.innerHTML = row('다음 글', all[index - 1]) + row('이전 글', all[index + 1]);
})();
