"use strict";
// License: MIT

import { ALLOWED_SCHEMES } from "./constants";
import { hostToDomain } from "./util";

const CONCURRENCY = 4;
const FETCH_TIMEOUT = 20 * 1000;
// eslint-disable-next-line no-magic-numbers
const MAX_PAGE_BYTES = 10 * 1024 * 1024;
// eslint-disable-next-line no-magic-numbers
const MAX_ITEMS_PER_TYPE = 1000;

// eslint-disable-next-line max-len
const REG_TITLE = /<title[^>]*>([^<]{1,500})<\/title>/i;
// eslint-disable-next-line max-len
const REG_HREF = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
// eslint-disable-next-line max-len
const REG_SRC = /<(?:img|source|video|audio|embed|iframe|track)\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
// eslint-disable-next-line max-len
const REG_SRCSET = /<(?:img|source)\b[^>]*?\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
// eslint-disable-next-line max-len
const REG_DATA = /<(?:img|source)\b[^>]*?\bdata-(?:src|original|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const REG_EXT = /\.([a-z0-9]{1,10})$/i;

export interface CrawlOptions {
  depth: number;
  maxPages: number;
  extensions: string[];
}

export interface CrawlResult {
  links: any[];
  media: any[];
  pages: number;
}

interface CrawlJob {
  url: string;
  depth: number;
}

function getAttr(match: RegExpExecArray) {
  return match[1] || match[2] || match[3] || "";
}

/**
 * Split a comma/space separated list of file extensions into clean tokens.
 *
 * @param {string | string[]} extensions Raw extension list.
 * @returns {string[]} Cleaned extension tokens (no dots, lowercased).
 */
export function parseExtensions(extensions: string | string[]): string[] {
  if (Array.isArray(extensions)) {
    return extensions.map(
      e => String(e).trim().toLowerCase().replace(/^\./, "")).filter(Boolean);
  }
  if (typeof extensions !== "string") {
    return [];
  }
  return extensions.split(/[,\s]+/).map(
    e => e.trim().toLowerCase().replace(/^\./, "")).filter(Boolean);
}

function getDomain(url: URL) {
  return hostToDomain(url.hostname) || url.hostname;
}

function extractTitle(html: string) {
  const m = REG_TITLE.exec(html);
  if (!m) {
    return "";
  }
  return m[1].replace(/[\s\t\r\n]+/g, " ").trim();
}

function collectUrls(html: string, regex: RegExp) {
  const rv: string[] = [];
  let m: RegExpExecArray | null;
  regex.lastIndex = 0;
  while ((m = regex.exec(html))) {
    const url = getAttr(m).trim();
    if (url) {
      rv.push(url);
    }
  }
  return rv;
}

function expandSrcset(srcset: string) {
  return srcset.split(",").map(e => e.trim().split(/\s+/)[0]).filter(Boolean);
}

function collectMediaRefs(html: string) {
  const rv = collectUrls(html, REG_SRC);
  rv.push(...collectUrls(html, REG_DATA));
  for (const set of collectUrls(html, REG_SRCSET)) {
    rv.push(...expandSrcset(set));
  }
  return rv;
}

function isFileURL(url: URL, extensions: Set<string>) {
  const m = REG_EXT.exec(url.pathname);
  if (!m) {
    return false;
  }
  return extensions.has(m[1].toLowerCase());
}

function titleFor(url: URL) {
  const seg = url.pathname.split("/").pop() || "";
  try {
    return decodeURIComponent(seg) || url.hostname;
  }
  catch (ex) {
    return seg || url.hostname;
  }
}

function makeItem(surl: string, page: URL, title: string, pageTitle: string) {
  try {
    const url = new URL(surl, page);
    if (!ALLOWED_SCHEMES.has(url.protocol)) {
      return null;
    }
    url.hash = "";
    return {
      url: url.href,
      title,
      description: pageTitle,
      referrer: page.href,
      usableReferrer: page.href,
    };
  }
  catch (ex) {
    return null;
  }
}

async function fetchPage(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const resp = await fetch(url, {
      credentials: "omit",
      redirect: "follow",
      signal: controller.signal,
    });
    if (!resp.ok) {
      return null;
    }
    const type = resp.headers.get("content-type") || "";
    if (type && !/text\/html|application\/xhtml\+xml/i.test(type)) {
      return null;
    }
    const text = await resp.text();
    if (text.length > MAX_PAGE_BYTES) {
      return null;
    }
    return text;
  }
  catch (ex) {
    return null;
  }
  finally {
    clearTimeout(timer);
  }
}

async function runPool(
    queue: CrawlJob[], worker: (job: CrawlJob) => Promise<void>) {
  let idx = 0;
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(CONCURRENCY, Math.max(queue.length, 1)); ++i) {
    workers.push((async () => {
      while (idx < queue.length) {
        await worker(queue[idx++]);
      }
    })());
  }
  await Promise.all(workers);
}

/**
 * Recursively fetch pages linked from the seeds (up to depth/maxPages),
 * collecting media and file-like links found on them.
 *
 * @param {Array<{url: string}>} seeds Starting URLs (usually the links of
 *   the current page).
 * @param {Array<{url: string}>} existing Items already known; their URLs are
 *   not added again.
 * @param {CrawlOptions} options Crawling limits.
 * @returns {Promise<CrawlResult>} Newly found links and media items.
 */
export async function crawl(
    seeds: Array<{url: string}>,
    existing: Array<{url: string}>,
    options: CrawlOptions): Promise<CrawlResult> {
  const maxDepth = Math.max(1, Math.min(10, Math.floor(options.depth) || 3));
  const maxPages = Math.max(
    1, Math.min(1000, Math.floor(options.maxPages) || 100));
  const extensions = new Set(parseExtensions(options.extensions));

  const domains = new Set<string>();
  for (const seed of seeds) {
    try {
      const domain = getDomain(new URL(seed.url));
      if (domain) {
        domains.add(domain);
      }
    }
    catch (ex) {
      // ignored
    }
  }

  const known = new Set<string>();
  for (const item of existing) {
    try {
      const url = new URL(item.url);
      url.hash = "";
      known.add(url.href);
    }
    catch (ex) {
      // ignored
    }
  }

  const visited = new Set<string>();
  const queue: CrawlJob[] = [];
  const foundLinks = new Map<string, any>();
  const foundMedia = new Map<string, any>();
  let pagesFetched = 0;

  const sameDomain = function(url: URL) {
    return domains.has(getDomain(url));
  };

  const enqueue = function(surl: string, depth: number) {
    if (depth > maxDepth) {
      return;
    }
    let url: URL;
    try {
      url = new URL(surl);
    }
    catch (ex) {
      return;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return;
    }
    url.hash = "";
    const {href} = url;
    if (visited.has(href) || isFileURL(url, extensions) || !sameDomain(url)) {
      return;
    }
    visited.add(href);
    queue.push({url: href, depth});
  };

  for (const seed of seeds) {
    enqueue(seed.url, 0);
  }

  await runPool(queue, async job => {
    if (pagesFetched >= maxPages) {
      return;
    }
    pagesFetched++;
    const html = await fetchPage(job.url);
    if (!html) {
      pagesFetched--;
      return;
    }
    const page = new URL(job.url);
    const pageTitle = extractTitle(html) || titleFor(page);

    for (const ref of collectMediaRefs(html)) {
      const item = makeItem(ref, page, "", pageTitle);
      if (item && foundMedia.size < MAX_ITEMS_PER_TYPE &&
          !foundMedia.has(item.url) && !known.has(item.url)) {
        foundMedia.set(item.url, item);
      }
    }

    for (const href of collectUrls(html, REG_HREF)) {
      let url: URL;
      try {
        url = new URL(href, page);
      }
      catch (ex) {
        continue;
      }
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        continue;
      }
      url.hash = "";
      const {href: target} = url;
      if (isFileURL(url, extensions)) {
        if (foundLinks.size < MAX_ITEMS_PER_TYPE &&
            !foundLinks.has(target) && !known.has(target)) {
          foundLinks.set(
            target, makeItem(target, page, titleFor(url), pageTitle));
        }
      }
      else if (!visited.has(target)) {
        enqueue(target, job.depth + 1);
      }
    }
  });

  return {
    links: Array.from(foundLinks.values()),
    media: Array.from(foundMedia.values()),
    pages: pagesFetched,
  };
}
