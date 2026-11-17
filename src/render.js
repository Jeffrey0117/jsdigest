'use strict';
const { escapeHtml, sanitizeBody, toText, truncate, textLength } = require('./html');

const COLLAPSE_OVER = 1600; // chars of visible text before an answer collapses

// SO titles arrive already HTML-encoded, so they are safe to drop in as-is.
const titleHtml = (q) => q.title;
const titleText = (q) => toText(q.title);

function layout({ title, description, body, depth }) {
  const up = depth > 0 ? '../'.repeat(depth) : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description || '')}">
<link rel="icon" type="image/svg+xml" href="${up}assets/favicon.svg">
<meta name="theme-color" content="#1f1b16">
<link rel="stylesheet" href="${up}assets/style.css">
</head>
<body>
${body}
</body>
</html>`;
}

function scoreBadge(score) {
  const hot = score >= 1000 ? ' hot' : '';
  return `<span class="score${hot}" title="${escapeHtml(score)} votes">${formatScore(score)}</span>`;
}

function formatScore(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function tagList(tags, { link } = {}) {
  return tags.map((t) => link
    ? `<button type="button" class="tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`
    : `<span class="tag">${escapeHtml(t)}</span>`).join('');
}

function year(epochSeconds) {
  if (!epochSeconds) return '';
  return new Date(epochSeconds * 1000).getUTCFullYear();
}

function siteFooter() {
  return `<footer class="site-footer">
  <p>題目與答案來自 <a href="https://stackoverflow.com" rel="noopener">Stack Overflow</a>，依
  <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="license noopener">CC BY-SA 4.0</a> 使用，各題皆附原文與作者連結。
  本站為個人學習用的濃縮閱讀站，非 Stack Overflow 官方。</p>
</footer>`;
}

function questionRow(q, hrefPrefix) {
  const snippet = truncate(toText(q.bodyHtml), 180);
  const tagsAttr = q.tags.join(' ').toLowerCase();
  const searchAttr = `${titleText(q)} ${tagsAttr}`.toLowerCase();
  return `<article class="q" data-id="${q.id}" data-tags="${escapeHtml(tagsAttr)}" data-search="${escapeHtml(searchAttr)}">
    <div class="q-score">${scoreBadge(q.score)}</div>
    <div class="q-main">
      <h2 class="q-title"><a href="${hrefPrefix}q/${q.id}.html">${titleHtml(q)}</a></h2>
      <p class="q-snippet">${escapeHtml(snippet)}</p>
      <div class="q-meta"><span class="year">${year(q.creationDate)}</span>${tagList(q.tags)}<span class="dot">·</span>${q.answers.length} 重點答案<span class="dot">·</span>${formatScore(q.viewCount || 0)} 次瀏覽</div>
    </div>
  </article>`;
}

function renderIndex(data) {
  const header = `<header class="site-header">
  <div class="wrap">
    <h1 class="brand"><a href="index.html">${escapeHtml(data.siteTitle)}</a></h1>
    <p class="tagline">${escapeHtml(data.siteTagline)}</p>
    <nav class="topnav"><a href="topics.html">按學習主題逛 →</a></nav>
    <input id="search" class="search" type="search" placeholder="搜尋題目或標籤…" autocomplete="off" aria-label="搜尋">
    <div id="tags" class="tag-filter">${tagList(data.topTags, { link: true })}</div>
    <div id="prac" class="prac-filter" hidden>
      <button type="button" class="prac-btn on" data-prac="all">全部</button>
      <button type="button" class="prac-btn" data-prac="todo">未練</button>
      <button type="button" class="prac-btn" data-prac="done">練過 <span id="done-count">0</span></button>
    </div>
    <p class="count"><span id="shown">${data.questions.length}</span> / ${data.questions.length} 題 · 依票數排序</p>
  </div>
</header>`;

  const rows = data.questions.map((q) => questionRow(q, '')).join('\n');

  const body = `${header}
<main class="wrap">
  <div id="list" class="list">
${rows}
  </div>
  <p id="empty" class="empty" hidden>沒有符合的題目。</p>
</main>
${siteFooter()}
<script src="assets/app.js"></script>`;

  return layout({
    title: `${data.siteTitle} · ${data.siteTagline}`,
    description: `逛著學 JavaScript：${data.questions.length} 題 Stack Overflow 高票問題與重點答案。`,
    body,
    depth: 0,
  });
}

function renderAnswer(a) {
  const safe = sanitizeBody(a.bodyHtml);
  const accepted = a.isAccepted ? '<span class="accepted">採納</span>' : '';
  const ownerHtml = a.owner.link
    ? `<a href="${escapeHtml(a.owner.link)}" rel="noopener">${escapeHtml(a.owner.name)}</a>`
    : escapeHtml(a.owner.name);
  const head = `<div class="a-head">${scoreBadge(a.score)}${accepted}
    <span class="a-by">by ${ownerHtml}</span>
    <a class="a-src" href="${escapeHtml(a.link)}" rel="noopener">原文 ↗</a></div>`;

  if (textLength(a.bodyHtml) > COLLAPSE_OVER) {
    return `<article class="a">${head}
    <details><summary>展開這則答案</summary><div class="prose">${safe}</div></details>
  </article>`;
  }
  return `<article class="a">${head}<div class="prose">${safe}</div></article>`;
}

function renderDetail(q, data) {
  const ownerHtml = q.owner.link
    ? `<a href="${escapeHtml(q.owner.link)}" rel="noopener">${escapeHtml(q.owner.name)}</a>`
    : escapeHtml(q.owner.name);

  const answers = q.answers.length
    ? q.answers.map(renderAnswer).join('\n')
    : '<p class="empty">這題沒有抓到答案，點下方原文到 Stack Overflow 看。</p>';

  const body = `<header class="site-header slim">
  <div class="wrap">
    <a class="back" href="../index.html">← ${escapeHtml(data.siteTitle)}</a>
  </div>
</header>
<main class="wrap detail">
  <article class="question">
    <h1>${titleHtml(q)}</h1>
    <div class="q-meta big">${scoreBadge(q.score)}<span class="q-by">${year(q.creationDate)} 年提問 · ${ownerHtml}</span>
      <span class="dot">·</span>${tagList(q.tags)}
      ${q.topicSlug ? `<a class="topic-chip" href="../topic/${q.topicSlug}.html">主題：${escapeHtml(q.topicLabel)} →</a>` : ''}
      <a class="a-src" href="${escapeHtml(q.link)}" rel="noopener">在 Stack Overflow 看原文 ↗</a></div>
    <div class="prose">${sanitizeBody(q.bodyHtml)}</div>
  </article>
  <section class="practice" data-id="${q.id}" hidden>
    <div class="practice-head">
      <h2>我的練習</h2>
      <button type="button" class="mark-btn">標記為練過</button>
    </div>
    <p class="practice-hint">先自己寫寫看怎麼答，再往下對照重點答案。只存在你這台瀏覽器。</p>
    <textarea class="my-answer" placeholder="在這裡寫你的答案…"></textarea>
    <div class="practice-actions">
      <button type="button" class="save-btn">存起來</button>
      <span class="save-state" aria-live="polite"></span>
    </div>
  </section>
  <section class="answers">
    <h2>重點答案</h2>
${answers}
  </section>
</main>
${siteFooter()}
<script src="../assets/app.js"></script>`;

  return layout({
    title: `${titleText(q)} · ${data.siteTitle}`,
    description: truncate(toText(q.bodyHtml), 160),
    body,
    depth: 1,
  });
}

function renderTopicsIndex(data) {
  const cards = data.topics.map((t) => {
    const ids = t.questions.map((q) => q.id).join(',');
    return `<a class="topic-card" href="topic/${t.slug}.html" data-ids="${ids}">
    <div class="topic-row">
      <h2 class="topic-name">${escapeHtml(t.label)}</h2>
      <span class="topic-count">${t.questions.length} 題 · 練過 <span class="topic-done">0</span></span>
    </div>
    <p class="topic-blurb">${escapeHtml(t.blurb)}</p>
  </a>`;
  }).join('\n');

  const body = `<header class="site-header">
  <div class="wrap">
    <h1 class="brand"><a href="index.html">${escapeHtml(data.siteTitle)}</a></h1>
    <p class="tagline">學習主題 · 把題目照概念分組</p>
    <nav class="topnav"><a href="index.html">← 回全部題目</a></nav>
  </div>
</header>
<main class="wrap">
  <div class="topics">
${cards}
  </div>
</main>
${siteFooter()}
<script src="assets/app.js"></script>`;

  return layout({
    title: `學習主題 · ${data.siteTitle}`,
    description: `把 ${data.siteTitle} 的 JavaScript 題目照學習主題分組，一塊一塊逛。`,
    body,
    depth: 0,
  });
}

function renderTopicPage(topic, data) {
  const rows = topic.questions.map((q) => questionRow(q, '../')).join('\n');
  const body = `<header class="site-header slim">
  <div class="wrap">
    <a class="back" href="../topics.html">← 所有主題</a>
  </div>
</header>
<main class="wrap">
  <div class="topic-head">
    <h1>${escapeHtml(topic.label)}</h1>
    <p class="tagline">${escapeHtml(topic.blurb)}</p>
    <input id="search" class="search" type="search" placeholder="在這個主題裡搜尋…" autocomplete="off" aria-label="搜尋">
    <div id="prac" class="prac-filter" hidden>
      <button type="button" class="prac-btn on" data-prac="all">全部</button>
      <button type="button" class="prac-btn" data-prac="todo">未練</button>
      <button type="button" class="prac-btn" data-prac="done">練過 <span id="done-count">0</span></button>
    </div>
    <p class="count"><span id="shown">${topic.questions.length}</span> / ${topic.questions.length} 題 · 依票數排序</p>
  </div>
  <div id="list" class="list">
${rows}
  </div>
  <p id="empty" class="empty" hidden>沒有符合的題目。</p>
</main>
${siteFooter()}
<script src="../assets/app.js"></script>`;

  return layout({
    title: `${topic.label} · ${data.siteTitle}`,
    description: topic.blurb,
    body,
    depth: 1,
  });
}

module.exports = { renderIndex, renderDetail, renderTopicsIndex, renderTopicPage, formatScore };
