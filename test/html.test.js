'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { escapeHtml, sanitizeBody, toText, truncate, textLength } = require('../src/html');

test('sanitizeBody strips scripts, iframes, handlers and javascript: urls', () => {
  const dirty = `<p>ok</p><script>steal()</script><iframe src="x"></iframe>` +
    `<a href="javascript:alert(1)" onclick="bad()">link</a><img src="javascript:bad" onerror="x">`;
  const clean = sanitizeBody(dirty);
  assert.ok(clean.includes('<p>ok</p>'));
  assert.ok(!/<script/i.test(clean));
  assert.ok(!/<iframe/i.test(clean));
  assert.ok(!/onclick/i.test(clean));
  assert.ok(!/onerror/i.test(clean));
  assert.ok(!/javascript:/i.test(clean));
});

test('sanitizeBody keeps normal code markup', () => {
  const html = '<pre class="lang-js"><code>const a = [1,2];</code></pre>';
  assert.equal(sanitizeBody(html), html);
});

test('toText strips tags and decodes common entities', () => {
  assert.equal(toText('<p>a &amp; b &quot;c&quot;</p>'), 'a & b "c"');
  assert.equal(toText('What does &quot;use strict&quot; do?'), 'What does "use strict" do?');
});

test('truncate adds an ellipsis only when over length', () => {
  assert.equal(truncate('short', 10), 'short');
  assert.equal(truncate('a very long line', 6), 'a ver…');
});

test('textLength measures visible text, not markup', () => {
  assert.equal(textLength('<p><b>hi</b></p>'), 2);
});

test('escapeHtml escapes the five characters', () => {
  assert.equal(escapeHtml(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
});
