'use strict';

// Hand-written tag → learning-topic mapping. A question is placed in the FIRST
// topic (in this order) that shares any of its tags; the rest fall into 其他.
// This is deterministic and free — no AI. Tweak the tag lists to re-group.
const TOPICS = [
  { slug: 'node', label: 'Node 與工具鏈', blurb: 'Node.js、npm、模組安裝與命令列環境。',
    tags: ['node.js', 'npm', 'bower', 'express', 'fs', 'command-line-arguments', 'environment-variables', 'dependency-management', 'eslint', 'jshint', 'jslint', 'postman'] },
  { slug: 'async', label: '非同步', blurb: 'callback、Promise、async/await 與事件迴圈。',
    tags: ['asynchronous', 'promise', 'async-await', 'callback', 'sleep', 'setinterval', 'ecmascript-2017'] },
  { slug: 'this', label: 'this、原型與 new', blurb: 'this 指向、bind/call/apply、prototype 與 new。',
    tags: ['this', 'prototype', 'prototype-oriented', 'new-operator'] },
  { slug: 'scope', label: '作用域、閉包與變數', blurb: 'closure、hoisting、var/let 與 "use strict"。',
    tags: ['closures', 'scope', 'var', 'let', 'variables', 'use-strict', 'hoisting', 'keyword'] },
  { slug: 'functions', label: '函式', blurb: '參數、arguments、方法與函數式寫法。',
    tags: ['function', 'arguments', 'parameters', 'default-parameters', 'methods', 'void', 'functional-programming'] },
  { slug: 'arrays', label: '陣列與迴圈', blurb: '增刪、排序、去重、map/filter/reduce 與遍歷。',
    tags: ['arrays', 'sorting', 'unique', 'duplicates', 'shuffle', 'slice', 'flatten', 'multidimensional-array', 'map-function', 'loops', 'for-loop', 'foreach', 'each', 'iteration', 'range', 'list'] },
  { slug: 'objects', label: '物件、JSON 與拷貝', blurb: '深淺拷貝、合併、遍歷、比較與 JSON。',
    tags: ['object', 'javascript-objects', 'clone', 'deep-copy', 'merge', 'properties', 'object-property', 'object-literal', 'object-comparison', 'spread-syntax', 'serialization', 'json', 'pretty-print', 'pass-by-value', 'pass-by-reference'] },
  { slug: 'strings', label: '字串與正規', blurb: '擷取、取代、比對與正規表達式。',
    tags: ['string', 'regex', 'substring', 'replace', 'trim', 'startswith', 'string-matching', 'concatenation', 'uppercase', 'string-conversion', 'multiline', 'email-validation', 'encoding', 'parsing'] },
  { slug: 'types', label: '型別、比較與數字', blurb: '== vs ===、型別轉換、null/undefined 與數字格式。',
    tags: ['comparison', 'comparison-operators', 'equality', 'equality-operator', 'identity-operator', 'null', 'undefined', 'boolean-expression', 'boolean-operations', 'numbers', 'numeric', 'integer', 'number-formatting', 'rounding', 'decimal-point', 'hex', 'radix', 'random', 'currency', 'data-conversion', 'null-coalescing-operator', 'null-coalescing', 'types', 'enums', 'terminology', 'operators', 'syntax'] },
  { slug: 'dates', label: '日期與時間', blurb: '日期解析、格式化與時間計算。',
    tags: ['date', 'datetime', 'datetime-format', 'date-formatting', 'time-format', 'time', 'timestamp', 'date-arithmetic', 'java-dateformat'] },
  { slug: 'web', label: '網址、導頁與 AJAX', blurb: '改網址、導頁、query string、AJAX 與跨域。',
    tags: ['url', 'href', 'http-redirect', 'redirect', 'reload', 'refresh', 'location', 'query-string', 'url-parameters', 'url-rewriting', 'friendly-url', 'urlencode', 'encode', 'ajax', 'cors', 'same-origin-policy', 'cross-domain', 'jsonp', 'xmlhttprequest', 'post', 'xhr', 'security'] },
  { slug: 'dom', label: 'DOM、事件、表單與 jQuery', blurb: '選取、修改、事件、表單，jQuery 與前端框架。',
    tags: ['dom', 'dom-events', 'dom-manipulation', 'events', 'event-handling', 'event-propagation', 'click', 'scroll', 'checkbox', 'checked', 'selected', 'radio-button', 'disabled-input', 'html-input', 'html-select', 'drop-down-menu', 'forms', 'submit', 'visibility', 'display', 'css', 'append', 'jquery', 'jquery-selectors', 'jquery-append', 'attr', 'prop', 'html', 'xhtml', 'html-table', 'clipboard', 'copy-paste', 'position', 'layout', 'reactjs', 'react-router', 'angularjs', 'jsx', 'data-binding', 'underscore.js', 'lodash', 'plugins', 'local-storage', 'browser-detection', 'google-chrome', 'internet-explorer', 'mobile', 'cross-browser', 'tabs'] },
];

const MISC = { slug: 'misc', label: '其他', blurb: '還沒歸進上面主題的題。', tags: [] };

// Build a tag → topic index once (first topic wins on overlap, by TOPICS order).
const tagIndex = new Map();
for (const topic of TOPICS) {
  for (const t of topic.tags) if (!tagIndex.has(t)) tagIndex.set(t, topic);
}

function topicFor(question) {
  for (const t of question.tags) {
    const hit = tagIndex.get(t);
    if (hit) return hit;
  }
  return MISC;
}

// Returns new question objects (never mutates) annotated with topicSlug/topicLabel,
// plus the topic groups in display order (empty topics dropped, 其他 last).
function assignTopics(questions) {
  const annotated = questions.map((q) => {
    const topic = topicFor(q);
    return { ...q, topicSlug: topic.slug, topicLabel: topic.label };
  });
  const order = [...TOPICS, MISC];
  const groups = order
    .map((topic) => ({
      ...topic,
      questions: annotated.filter((q) => q.topicSlug === topic.slug),
    }))
    .filter((g) => g.questions.length > 0);
  return { topics: groups, questions: annotated };
}

module.exports = { TOPICS, MISC, assignTopics, topicFor };
