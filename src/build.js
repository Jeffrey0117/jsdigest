'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { config } = require('./config');
const { renderIndex, renderDetail } = require('./render');

function loadData() {
  let raw;
  try { raw = fs.readFileSync(config.dataFile, 'utf8'); } catch (_) {
    console.error(`找不到 ${config.dataFile}，請先跑  npm run fetch`);
    process.exit(1);
  }
  return JSON.parse(raw);
}

function topTags(questions, limit) {
  const freq = new Map();
  for (const q of questions) for (const t of q.tags) freq.set(t, (freq.get(t) || 0) + 1);
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([t]) => t);
}

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith('.html')) fs.rmSync(path.join(dir, name));
  }
}

function copyAssets() {
  const dest = path.join(config.outDir, 'assets');
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(config.assetsDir)) {
    fs.copyFileSync(path.join(config.assetsDir, name), path.join(dest, name));
  }
}

function main() {
  const data = loadData();
  const view = {
    ...data,
    siteTitle: config.siteTitle,
    siteTagline: config.siteTagline,
    topTags: topTags(data.questions, 12),
  };

  fs.mkdirSync(config.outDir, { recursive: true });
  const qDir = path.join(config.outDir, 'q');
  fs.mkdirSync(qDir, { recursive: true });
  cleanDir(config.outDir);
  cleanDir(qDir);

  fs.writeFileSync(path.join(config.outDir, 'index.html'), renderIndex(view));
  for (const q of data.questions) {
    fs.writeFileSync(path.join(qDir, `${q.id}.html`), renderDetail(q, view));
  }
  copyAssets();

  console.log(`Built ${data.questions.length} pages → ${config.outDir}`);
}

main();
