'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { renderIndex, renderDetail, formatScore } = require('../src/render');

function sampleQuestion(over) {
  return {
    id: 42,
    title: 'What does &quot;use strict&quot; do?',
    link: 'https://stackoverflow.com/q/42',
    score: 8548,
    tags: ['javascript', 'syntax'],
    answerCount: 3,
    viewCount: 13647000,
    owner: { name: 'Mark', link: 'https://stackoverflow.com/u/1' },
    bodyHtml: '<p>why use strict</p>' + (over ? '<p>'.padEnd(2000, 'x') + '</p>' : ''),
    answers: [
      { id: 7, score: 5500, isAccepted: true, link: 'https://stackoverflow.com/a/7', owner: { name: 'Pascal', link: '' }, bodyHtml: '<p>accepted</p>' },
      { id: 8, score: 886, isAccepted: false, link: 'https://stackoverflow.com/a/8', owner: { name: 'evil', link: '' }, bodyHtml: '<p>fine</p><script>steal()</script>' },
    ],
  };
}

const view = { siteTitle: 'jsdigest', siteTagline: 'tag', topTags: ['javascript', 'syntax'], questions: [sampleQuestion(false)] };

test('formatScore: k and M tiers, plain below 1000', () => {
  assert.equal(formatScore(886), '886');
  assert.equal(formatScore(8548), '8.5k');
  assert.equal(formatScore(17046), '17k');
  assert.equal(formatScore(13647000), '13.6M');
});

test('index page has search box, tag filter and a question link', () => {
  const html = renderIndex(view);
  assert.ok(html.includes('id="search"'));
  assert.ok(html.includes('data-tag="javascript"'));
  assert.ok(html.includes('href="q/42.html"'));
  // encoded title passes through without being double-escaped
  assert.ok(html.includes('&quot;use strict&quot;'));
  assert.ok(!html.includes('&amp;quot;'));
});

test('index rows carry their id and the page offers a practiced filter + year', () => {
  const html = renderIndex(view);
  assert.ok(html.includes('data-id="42"'));
  assert.ok(html.includes('data-prac="done"'));
  assert.ok(html.includes('class="year">'));
});

test('detail page includes the practice panel and loads the client script', () => {
  const html = renderDetail(sampleQuestion(false), view);
  assert.ok(html.includes('class="practice"'));
  assert.ok(html.includes('my-answer'));
  assert.ok(html.includes('標記為練過'));
  assert.ok(html.includes('../assets/app.js'));
  assert.ok(html.includes('年提問'));
});

test('detail page marks the accepted answer and links to the SO original', () => {
  const html = renderDetail(sampleQuestion(false), view);
  assert.ok(html.includes('採納'));
  assert.ok(html.includes('https://stackoverflow.com/q/42'));
  assert.ok(html.includes('https://stackoverflow.com/a/7'));
});

test('detail page never emits a script tag from answer bodies', () => {
  const html = renderDetail(sampleQuestion(false), view);
  assert.ok(!/<script>steal/i.test(html));
});

test('a long answer is wrapped in a collapsible details element', () => {
  const q = sampleQuestion(false);
  q.answers[0].bodyHtml = '<p>' + 'word '.repeat(500) + '</p>';
  const html = renderDetail(q, view);
  assert.ok(html.includes('<details>'));
  assert.ok(html.includes('展開這則答案'));
});
