// lib/learnFeedCache.js
// Thin Redis wrapper around the unified Learn With Us feed.
//
// Every admin content controller calls invalidate() after a successful
// create/update/delete so the next visitor sees fresh content immediately.

const REDIS = require("./redisClient");

const CACHE_KEY = "learn:feed:v1";
const CACHE_TTL_SECONDS = 60;

async function get() {
  try {
    const raw = await REDIS.get(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function set(payload) {
  try {
    await REDIS.set(CACHE_KEY, JSON.stringify(payload), "EX", CACHE_TTL_SECONDS);
  } catch (e) {
    /* cache is best-effort */
  }
}

async function invalidate() {
  try {
    await REDIS.del(CACHE_KEY);
  } catch (e) {
    /* cache is best-effort */
  }
}

module.exports = { get, set, invalidate, CACHE_TTL_SECONDS };