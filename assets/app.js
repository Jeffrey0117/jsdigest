// jsdigest client: index filtering + per-question practice. No network, no deps.
// Practice state lives only in this browser (localStorage); it can be absent or
// throw (private windows, blocked storage), so every access is guarded.
(function () {
  'use strict';

  var KEY = 'jsdigest:practice';

  function readStore() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; }
  }
  function writeStore(obj) {
    try { localStorage.setItem(KEY, JSON.stringify(obj)); return true; } catch (_) { return false; }
  }
  function isDone(store, id) { return !!(store[id] && store[id].done); }
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function hhmm(iso) { var d = new Date(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

  // ---------- index page ----------
  function initIndex(list) {
    var items = Array.prototype.slice.call(list.querySelectorAll('.q'));
    var search = document.getElementById('search');
    var tagsBox = document.getElementById('tags');
    var pracBox = document.getElementById('prac');
    var shown = document.getElementById('shown');
    var doneCount = document.getElementById('done-count');
    var empty = document.getElementById('empty');

    var query = '';
    var activeTag = '';
    var activePrac = 'all';

    var store = readStore();
    var done = 0;
    items.forEach(function (el) {
      if (isDone(store, el.getAttribute('data-id'))) {
        el.classList.add('is-done');
        var meta = el.querySelector('.q-meta');
        if (meta && !meta.querySelector('.done-badge')) {
          var b = document.createElement('span');
          b.className = 'done-badge';
          b.textContent = '練過 ✓';
          meta.insertBefore(b, meta.firstChild);
        }
        done++;
      }
    });
    if (doneCount) doneCount.textContent = String(done);
    if (pracBox) pracBox.hidden = false;

    function apply() {
      var q = query.trim().toLowerCase();
      var n = 0;
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        var hitText = !q || el.getAttribute('data-search').indexOf(q) !== -1;
        var hitTag = !activeTag || (' ' + el.getAttribute('data-tags') + ' ').indexOf(' ' + activeTag + ' ') !== -1;
        var d = el.classList.contains('is-done');
        var hitPrac = activePrac === 'all' || (activePrac === 'done' ? d : !d);
        var ok = hitText && hitTag && hitPrac;
        el.hidden = !ok;
        if (ok) n++;
      }
      if (shown) shown.textContent = String(n);
      if (empty) empty.hidden = n !== 0;
    }

    if (search) search.addEventListener('input', function () { query = search.value; apply(); });
    if (tagsBox) tagsBox.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.tag') : null;
      if (!btn) return;
      var tag = btn.getAttribute('data-tag');
      if (activeTag === tag) { activeTag = ''; btn.classList.remove('on'); }
      else {
        activeTag = tag;
        var all = tagsBox.querySelectorAll('.tag');
        for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i] === btn);
      }
      apply();
    });
    if (pracBox) pracBox.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.prac-btn') : null;
      if (!btn) return;
      activePrac = btn.getAttribute('data-prac');
      var all = pracBox.querySelectorAll('.prac-btn');
      for (var i = 0; i < all.length; i++) all[i].classList.toggle('on', all[i] === btn);
      apply();
    });
  }

  // ---------- detail page ----------
  function initDetail(panel) {
    var id = panel.getAttribute('data-id');
    var textarea = panel.querySelector('.my-answer');
    var saveBtn = panel.querySelector('.save-btn');
    var markBtn = panel.querySelector('.mark-btn');
    var state = panel.querySelector('.save-state');

    var store = readStore();
    var entry = store[id] || {};
    if (textarea && entry.answer) textarea.value = entry.answer;
    panel.hidden = false;

    function reflectMark() {
      var cur = readStore()[id] || {};
      if (cur.done) { markBtn.textContent = '已練過 ✓（取消）'; markBtn.classList.add('on'); }
      else { markBtn.textContent = '標記為練過'; markBtn.classList.remove('on'); }
    }

    function set(patch) {
      var s = readStore();
      s[id] = Object.assign({}, s[id], patch);
      if (!s[id].answer && !s[id].done) delete s[id];
      return writeStore(s);
    }

    reflectMark();

    if (saveBtn && textarea) saveBtn.addEventListener('click', function () {
      var ok = set({ answer: textarea.value, done: true, at: new Date().toISOString() });
      if (state) state.textContent = ok ? '已存 · ' + hhmm(new Date().toISOString()) : '這個瀏覽器不讓存（無痕模式？）';
      reflectMark();
    });

    if (markBtn) markBtn.addEventListener('click', function () {
      var cur = readStore()[id] || {};
      set({ done: !cur.done, at: new Date().toISOString() });
      if (state) state.textContent = '';
      reflectMark();
    });
  }

  var list = document.getElementById('list');
  if (list) initIndex(list);
  var panel = document.querySelector('.practice');
  if (panel) initDetail(panel);
})();
