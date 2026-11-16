'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { config } = require('./config');
const { get } = require('./so-api');

const args = process.argv.slice(2);
const REFRESH = args.includes('--refresh');
const countArg = args.indexOf('--count');
const WANT = countArg !== -1 ? Number(args[countArg + 1]) || config.fetchCount : config.fetchCount;

function owner(o) {
  if (!o || !o.display_name) return { name: 'anonymous', link: '' };
  return { name: o.display_name, link: o.link || '' };
}

function answerLink(a) {
  return `https://stackoverflow.com/a/${a.answer_id}`;
}

// Fetch the top questions (by votes) for the tag, paging until we have WANT ids.
async function fetchTopQuestions(want) {
  const out = [];
  let page = 1;
  while (out.length < want) {
    const data = await get('questions', {
      tagged: config.fetchTag,
      sort: 'votes',
      order: 'desc',
      page,
      pagesize: 100,
      filter: 'withbody',
    });
    for (const q of data.items) out.push(q);
    process.stdout.write(`  questions: ${out.length} (quota left ${data.quota_remaining})\r`);
    if (!data.has_more) break;
    page += 1;
  }
  process.stdout.write('\n');
  return out.slice(0, want);
}

// Top answers for one question: accepted first, then by score, capped.
async function fetchAnswers(questionId, acceptedId, keep) {
  const data = await get(`questions/${questionId}/answers`, {
    sort: 'votes',
    order: 'desc',
    pagesize: Math.max(keep, 5),
    filter: 'withbody',
  });
  const items = (data.items || []).map((a) => ({
    id: a.answer_id,
    score: a.score,
    isAccepted: a.is_accepted || a.answer_id === acceptedId,
    link: answerLink(a),
    owner: owner(a.owner),
    bodyHtml: a.body || '',
  }));
  items.sort((x, y) => (y.isAccepted - x.isAccepted) || (y.score - x.score));
  return items.slice(0, keep);
}

function compactQuestion(q) {
  return {
    id: q.question_id,
    title: q.title,
    link: q.link,
    score: q.score,
    tags: q.tags || [],
    answerCount: q.answer_count,
    viewCount: q.view_count,
    creationDate: q.creation_date,
    acceptedAnswerId: q.accepted_answer_id || null,
    owner: owner(q.owner),
    bodyHtml: q.body || '',
    answers: [],
  };
}

function loadExisting() {
  try { return JSON.parse(fs.readFileSync(config.dataFile, 'utf8')); } catch (_) { return null; }
}

async function main() {
  console.log(`Fetching top ${WANT} "${config.fetchTag}" questions from Stack Overflow${config.apiKey ? ' (with key)' : ' (keyless)'}…`);

  const existing = !REFRESH ? loadExisting() : null;
  const haveAnswers = new Map();
  if (existing) for (const q of existing.questions) haveAnswers.set(q.id, q.answers);

  const raw = await fetchTopQuestions(WANT);
  const questions = raw.map(compactQuestion);

  let fetched = 0;
  let reused = 0;
  for (const q of questions) {
    if (!REFRESH && haveAnswers.has(q.id) && haveAnswers.get(q.id).length) {
      q.answers = haveAnswers.get(q.id);
      reused += 1;
    } else {
      q.answers = await fetchAnswers(q.id, q.acceptedAnswerId, config.answersPerQuestion);
      fetched += 1;
    }
    process.stdout.write(`  answers: ${fetched} fetched, ${reused} reused\r`);
  }
  process.stdout.write('\n');

  const result = {
    generatedAt: new Date().toISOString(),
    source: 'https://stackoverflow.com',
    license: 'CC BY-SA 4.0',
    tag: config.fetchTag,
    count: questions.length,
    questions,
  };
  fs.mkdirSync(path.dirname(config.dataFile), { recursive: true });
  fs.writeFileSync(config.dataFile, JSON.stringify(result, null, 2));
  console.log(`Saved ${questions.length} questions → ${config.dataFile}`);
}

main().catch((err) => { console.error('\nfetch failed:', err.message); process.exit(1); });
