'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { config } = require('./config');
const { renderIndex, renderDetail, renderTopicsIndex, renderTopicPage } = require('./render');
const { assignTopics } = require('./topics');

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
  const { topics, questions } = assignTopics(data.questions);
  const view = {
    ...data,
    questions,
    topics,
    siteTitle: config.siteTitle,
    siteTagline: config.siteTagline,
    topTags: topTags(questions, 12),
  };

  const qDir = path.join(config.outDir, 'q');
  const topicDir = path.join(config.outDir, 'topic');
  fs.mkdirSync(qDir, { recursive: true });
  fs.mkdirSync(topicDir, { recursive: true });
  cleanDir(config.outDir);
  cleanDir(qDir);
  cleanDir(topicDir);

  fs.writeFileSync(path.join(config.outDir, 'index.html'), renderIndex(view));
  fs.writeFileSync(path.join(config.outDir, 'topics.html'), renderTopicsIndex(view));
  for (const q of questions) {
    fs.writeFileSync(path.join(qDir, `${q.id}.html`), renderDetail(q, view));
  }
  for (const topic of topics) {
    fs.writeFileSync(path.join(topicDir, `${topic.slug}.html`), renderTopicPage(topic, view));
  }
  copyAssets();

  console.log(`Built ${questions.length} questions + ${topics.length} topics → ${config.outDir}`);
}

main();
