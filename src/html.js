'use strict';

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Defensive pass over Stack Overflow's (already-sanitised) HTML before we embed
// it in a static page: drop scripts, iframes, event handlers and javascript: URLs.
function sanitizeBody(html) {
  return String(html || '')
    .replace(/<\s*(script|iframe|object|embed|style)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|style)\b[^>]*\/?\s*>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*'\s*javascript:[^']*'/gi, "$1='#'");
}

// Strip tags + collapse whitespace → plain text (for list snippets / <title>).
function toText(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(str, len) {
  const s = String(str || '');
  if (s.length <= len) return s;
  return s.slice(0, len - 1).trimEnd() + '…';
}

// Rough length of the visible text inside an HTML fragment (for collapse decisions).
function textLength(html) {
  return toText(html).length;
}

module.exports = { escapeHtml, sanitizeBody, toText, truncate, textLength };
