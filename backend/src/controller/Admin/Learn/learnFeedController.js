'use strict';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const learnFeedCache = require('../../../lib/learnFeedCache');

// ---------------------------------------------------------------------------
// Unified "Learn With Us" feed.
//
// Content lives in four separate tables (blog / insight / video / quiz). This
// endpoint fans out one query per source, normalises every row into a single
// card contract and merges them into one chronologically sorted list, so the
// newest thing uploaded from any admin screen floats to the top.
//
// GET /foliomax/learn/feed?type=all|BLOG|INSIGHT|VIDEO|QUIZ&limit=12&cursor=...
// ---------------------------------------------------------------------------

const CONTENT_TYPES = ['BLOG', 'INSIGHT', 'VIDEO', 'QUIZ'];

// Tie-break rank, so equal timestamps produce a stable order across pages.
const TYPE_RANK = { BLOG: 0, INSIGHT: 1, VIDEO: 2, QUIZ: 3 };

// How deep to read from each source before merging.
const MAX_PER_SOURCE = 60;
// Quizzes are grouped per company, so read deeper for that source.
const MAX_QUIZ_ROWS = 300;

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

const VIDEO_FEED_TAG = process.env.LEARN_VIDEO_TAG || 'education';

function toIso(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function truncate(text, max) {
  const value = String(text || '').trim();
  if (value.length <= max) return value || null;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

/** "my-quiz_video-2024.mp4" -> "my quiz video 2024" */
function humanizeFileName(name) {
  return String(name || '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "uploads/videos/a.mp4" -> "/uploads/videos/a.mp4" */
function serverPath(storagePath) {
  const value = String(storagePath || '').trim().replace(/^\/+/, '');
  return value || null;
}

function categoryOf(category) {
  if (!category) return null;
  return {
    id: category.id ?? null,
    name: category.name ?? null,
    slug: category.slug ?? null,
  };
}

function makeItem(item) {
  return {
    type: item.type,
    typeRank: TYPE_RANK[item.type],
    id: item.id,
    title: item.title,
    excerpt: item.excerpt ?? null,
    // Server-relative path (or absolute URL). Frontend prefixes with API base.
    thumbnail: item.thumbnail ?? null,
    category: item.category ?? null,
    authorName: item.authorName ?? null,
    meta: item.meta ?? {},
    href: item.href,
    external: Boolean(item.external),
    publishedAt: item.publishedAt,
    publishedAtMs: new Date(item.publishedAt).getTime(),
  };
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

async function sourceBlogs() {
  const rows = await prisma.blog.findMany({
    where: { isPublished: true },
    // Relation field is `blogcategory` (the model has no `category` field).
    include: { blogcategory: { select: { id: true, name: true, slug: true } } },
    orderBy: { uploadedAt: 'desc' },
    take: MAX_PER_SOURCE,
  });

  return rows.map(({ blogcategory, ...b }) =>
    makeItem({
      type: 'BLOG',
      id: b.id,
      title: b.title,
      excerpt: b.subtitle,
      thumbnail: b.image,
      category: categoryOf(blogcategory),
      authorName: b.authorName,
      meta: {},
      href: `/detailed-blog/${b.id}`,
      external: false,
      publishedAt: toIso(b.uploadedAt || b.createdAt),
    })
  );
}

async function sourceInsights() {
  const rows = await prisma.insight.findMany({
    where: { isPublished: true },
    include: { insightcategory: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: MAX_PER_SOURCE,
  });

  return rows.map(({ insightcategory, ...i }) =>
    makeItem({
      type: 'INSIGHT',
      id: i.id,
      title: i.title,
      excerpt: i.shortDescription,
      thumbnail: i.coverImage,
      category: categoryOf(insightcategory),
      authorName: i.authorName,
      meta: { readingTime: i.readingTime || null },
      href: `/etf-mutual-insights?insight=${encodeURIComponent(i.slug)}`,
      external: false,
      // publishedAt is nullable on this table.
      publishedAt: toIso(i.publishedAt || i.createdAt),
    })
  );
}

async function sourceVideos() {
  const rows = await prisma.video.findMany({
    where: {
      isDeleted: false,
      isPublic: true,
      videotag: { some: { tag: { name: VIDEO_FEED_TAG } } },
    },
    include: { videotag: { include: { tag: { select: { name: true } } } } },
    orderBy: { uploadedAt: 'desc' },
    take: MAX_PER_SOURCE,
  });

  const items = [];

  for (const v of rows) {
    // `url` is absolute when the row was created through the upload endpoint,
    // but older rows only carry the server-relative `storagePath`. Normalise to
    // a path the frontend can prefix with its API base.
    const src = v.url || serverPath(v.storagePath);
    // A video card with no playable source is worse than no card at all.
    if (!src) continue;

    items.push(
      makeItem({
        type: 'VIDEO',
        id: v.id,
        title: v.title || humanizeFileName(v.originalName) || 'Learning Video',
        excerpt: truncate(v.description, 160),
        // No thumbnail column on the video table yet; the card falls back to a
        // first-frame <video> preview.
        thumbnail: null,
        category: {
          id: null,
          name: VIDEO_FEED_TAG,
          slug: VIDEO_FEED_TAG,
        },
        authorName: null,
        meta: {
          url: src,
          tags: (v.videotag || []).map((t) => t.tag?.name).filter(Boolean),
        },
        // Always a file link, never an in-app route.
        href: src,
        external: true,
        publishedAt: toIso(v.uploadedAt || v.createdAt),
      })
    );
  }

  return items;
}

/**
 * A quiz row is a question, not a publishable card. Collapse the questions into
 * one entry per company so the feed gets a handful of "X Quiz" cards instead of
 * dozens of near-identical ones. Timestamp = newest question in the company.
 */
async function sourceQuizzes() {
  const rows = await prisma.quiz.findMany({
    include: { company: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: MAX_QUIZ_ROWS,
  });

  const byCompany = new Map();

  for (const q of rows) {
    const key = q.company?.id ?? 'general';
    const existing = byCompany.get(key);

    if (!existing) {
      byCompany.set(key, {
        type: 'QUIZ',
        typeRank: TYPE_RANK.QUIZ,
        id: q.id,
        title: `${q.company?.name || 'General'} Quiz`,
        excerpt: truncate(q.question, 140),
        thumbnail: null,
        category: { id: q.company?.id ?? null, name: q.company?.name ?? null, slug: null },
        authorName: null,
        meta: { questionCount: 1 },
        href: '/quiz',
        external: false,
        publishedAt: toIso(q.createdAt),
        publishedAtMs: new Date(q.createdAt).getTime(),
      });
      continue;
    }

    existing.meta.questionCount += 1;
  }

  return [...byCompany.values()];
}

// ---------------------------------------------------------------------------
// Cursor
// ---------------------------------------------------------------------------

function encodeCursor(item) {
  return Buffer.from(
    `${item.publishedAtMs}|${item.typeRank}|${item.id}`,
    'utf8'
  ).toString('base64url');
}

function decodeCursor(raw) {
  try {
    const [ms, rank, id] = Buffer.from(String(raw), 'base64url')
      .toString('utf8')
      .split('|');
    const publishedAtMs = Number(ms);
    const typeRank = Number(rank);
    const refId = Number(id);
    if (
      !Number.isFinite(publishedAtMs) ||
      !Number.isFinite(typeRank) ||
      !Number.isFinite(refId)
    ) {
      return null;
    }
    return { publishedAtMs, typeRank, id: refId };
  } catch (e) {
    return null;
  }
}

/** publishedAt desc, then typeRank asc, then id desc. */
function isAfterCursor(item, cursor) {
  if (!cursor) return true;
  if (item.publishedAtMs !== cursor.publishedAtMs) {
    return item.publishedAtMs < cursor.publishedAtMs;
  }
  if (item.typeRank !== cursor.typeRank) {
    return item.typeRank > cursor.typeRank;
  }
  return item.id < cursor.id;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

exports.getLearnFeed = async (req, res) => {
  try {
    const rawType = String(req.query.type || 'all').toUpperCase();
    const type = CONTENT_TYPES.includes(rawType) ? rawType : 'all';

    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.trunc(limitRaw), MAX_LIMIT)
      : DEFAULT_LIMIT;

    const cursor = req.query.cursor ? decodeCursor(req.query.cursor) : null;

    // ---- cached merged list (all types, all pages) -----------------------
    let merged = await learnFeedCache.get();
    const cacheHit = Array.isArray(merged);

    // Never cached: if any source failed, force a fresh rebuild next request so
    // a transient error can't be pinned in Redis for the whole TTL.
    let degradedSources = [];

    if (!cacheHit) {
      const settled = await Promise.allSettled([
        sourceBlogs(),
        sourceInsights(),
        sourceVideos(),
        sourceQuizzes(),
      ]);

      const collected = [];

      settled.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          collected.push(...result.value);
        } else {
          const source = CONTENT_TYPES[index];
          degradedSources.push(source);
          console.error(
            `[learnFeed] source ${source} failed:`,
            result.reason && (result.reason.stack || result.reason.message || result.reason)
          );
        }
      });

      merged = collected
        .filter((i) => Number.isFinite(i.publishedAtMs))
        .sort((a, b) => {
          if (a.publishedAtMs !== b.publishedAtMs) return b.publishedAtMs - a.publishedAtMs;
          if (a.typeRank !== b.typeRank) return a.typeRank - b.typeRank;
          return b.id - a.id;
        });

      if (degradedSources.length === 0) {
        await learnFeedCache.set(merged);
      }
    }

    // ---- counts always reflect everything available -----------------------
    const counts = { all: merged.length };
    for (const t of CONTENT_TYPES) {
      counts[t] = merged.reduce((sum, i) => (i.type === t ? sum + 1 : sum), 0);
    }

    // ---- paginate ---------------------------------------------------------
    const eligible = merged.filter(
      (i) => (type === 'all' || i.type === type) && isAfterCursor(i, cursor)
    );

    const page = eligible.slice(0, limit);
    const hasMore = eligible.length > limit;
    const last = page[page.length - 1];

    // Strip internal sort fields before sending to the client.
    const items = page.map(({ typeRank, publishedAtMs, ...rest }) => rest);

    return res.json({
      success: true,
      data: {
        items,
        counts,
        meta: {
          type,
          limit,
          hasMore,
          cacheHit,
          // Non-empty when a source failed; the feed still serves the rest.
          degradedSources,
          nextCursor: hasMore && last ? encodeCursor(last) : null,
        },
      },
    });
  } catch (err) {
    console.error('[learnFeed.getLearnFeed]', err && (err.stack || err.message || err));
    return res
      .status(500)
      .json({ success: false, message: 'Could not load learn feed' });
  }
};

exports.CONTENT_TYPES = CONTENT_TYPES;