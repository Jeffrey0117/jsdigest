'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Tiny zero-dep .env loader. Only sets keys that aren't already in process.env.
function loadEnv(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (_) { return; }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

const ROOT = path.join(__dirname, '..');
loadEnv(path.join(ROOT, '.env'));

function num(name, fallback) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

const config = {
  root: ROOT,
  dataFile: path.join(ROOT, 'data', 'questions.json'),
  outDir: path.join(ROOT, 'docs'),
  assetsDir: path.join(ROOT, 'assets'),

  // StackExchange API key is OPTIONAL — keyless works (lower quota). Not a secret.
  apiKey: process.env.SO_API_KEY || '',

  siteTitle: process.env.SITE_TITLE || 'jsdigest',
  siteTagline: process.env.SITE_TAGLINE || '逛著學 JavaScript · 濃縮版 Stack Overflow',
  // Path prefix for GitHub Pages project sites, e.g. "/jsdigest". Empty for root.
  basePath: (process.env.BASE_PATH || '').replace(/\/+$/, ''),

  fetchTag: process.env.FETCH_TAG || 'javascript',
  fetchCount: num('FETCH_COUNT', 200),
  answersPerQuestion: num('ANSWERS_PER_QUESTION', 3),
};

module.exports = { config, loadEnv };
