'use strict';
const { config } = require('./config');

const BASE = 'https://api.stackexchange.com/2.3';
const SITE = 'stackoverflow';
// Generic, non-identifying client name. Never put the user's info here.
const USER_AGENT = 'jsdigest-static-site-builder';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// StackExchange asks clients to honour a `backoff` field; we also self-throttle.
let nextAllowedAt = 0;

async function get(endpoint, params = {}) {
  const url = new URL(`${BASE}/${endpoint}`);
  url.searchParams.set('site', SITE);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  if (config.apiKey) url.searchParams.set('key', config.apiKey);

  const wait = nextAllowedAt - Date.now();
  if (wait > 0) await sleep(wait);

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`StackExchange ${endpoint} HTTP ${res.status}`);
  const data = await res.json();              // undici auto-decompresses gzip
  if (data.error_id) throw new Error(`StackExchange error ${data.error_id}: ${data.error_message || data.error_name}`);

  // A little breathing room between calls; obey an explicit backoff.
  const backoffMs = data.backoff ? data.backoff * 1000 : 200;
  nextAllowedAt = Date.now() + backoffMs;
  return data;
}

module.exports = { get };
