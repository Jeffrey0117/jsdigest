// Client-side filtering for the index: search box + tag chips. No network, no deps.
(function () {
  'use strict';
  var list = document.getElementById('list');
  if (!list) return;
  var items = Array.prototype.slice.call(list.querySelectorAll('.q'));
  var search = document.getElementById('search');
  var tagsBox = document.getElementById('tags');
  var shown = document.getElementById('shown');
  var empty = document.getElementById('empty');

  var query = '';
  var activeTag = '';

  function apply() {
    var q = query.trim().toLowerCase();
    var n = 0;
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var hitText = !q || el.getAttribute('data-search').indexOf(q) !== -1;
      var hitTag = !activeTag || (' ' + el.getAttribute('data-tags') + ' ').indexOf(' ' + activeTag + ' ') !== -1;
      var ok = hitText && hitTag;
      el.hidden = !ok;
      if (ok) n++;
    }
    if (shown) shown.textContent = String(n);
    if (empty) empty.hidden = n !== 0;
  }

  if (search) {
    search.addEventListener('input', function () { query = search.value; apply(); });
  }
  if (tagsBox) {
    tagsBox.addEventListener('click', function (e) {
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
  }
})();
