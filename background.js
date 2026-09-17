import { Fzf, extendedMatch } from './fzf.es.js';

const DEFAULT_SETTINGS = {
  enableTabs: true,
  enableBookmarks: true,
  enableHistory: true,
  historyMonths: 1
};

let cachedItems = [];
let fzfInstance = null;
let lastFetchTime = 0;
let topResultItem = null;
let itemByUrlMap = new Map();
let latestQuery = '';
let currentQuerySeq = 0;

/**
 * i18n helper with fallback
 */
function t(key, fallback = '') {
  try {
    return chrome.i18n.getMessage(key) || fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Load user settings from chrome.storage.sync
 */
async function getSettings() {
  try {
    return await chrome.storage.sync.get(DEFAULT_SETTINGS);
  } catch (err) {
    console.warn('Failed to read settings from storage, using defaults:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Fetch all open tabs across all windows
 */
async function getOpenTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    return tabs
      .filter(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')))
      .map(t => ({
        type: 'tab',
        tabId: t.id,
        windowId: t.windowId,
        title: (t.title || t.url).trim(),
        url: t.url
      }));
  } catch (err) {
    console.error('Failed to get open tabs:', err);
    return [];
  }
}

/**
 * Fetch all bookmarks recursively
 */
async function getBookmarks() {
  try {
    const tree = await chrome.bookmarks.getTree();
    const bookmarks = [];

    function traverse(nodes) {
      for (const node of nodes) {
        if (node.url && (node.url.startsWith('http://') || node.url.startsWith('https://'))) {
          bookmarks.push({
            type: 'bookmark',
            title: (node.title || node.url).trim(),
            url: node.url
          });
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    }

    traverse(tree);
    return bookmarks;
  } catch (err) {
    console.error('Failed to get bookmarks:', err);
    return [];
  }
}

/**
 * Fetch browser history (0 = all history with safety cap of 50,000 items)
 */
async function getHistory(months = 1) {
  try {
    const safeMonths = Math.max(0, parseInt(months, 10) || 0);
    
    // If 0, search all-time history (startTime = 0), capped at 50,000 items for stability
    const startTime = safeMonths === 0 ? 0 : Date.now() - (safeMonths * 30 * 24 * 60 * 60 * 1000);
    const maxResults = safeMonths === 0 ? 50000 : Math.min(30000, safeMonths * 5000);

    const results = await chrome.history.search({
      text: '',
      startTime: startTime,
      maxResults: maxResults
    });

    return results
      .filter(item => item.url && (item.url.startsWith('http://') || item.url.startsWith('https://')))
      .map(item => ({
        type: 'history',
        title: (item.title || item.url).trim(),
        url: item.url,
        lastVisitTime: item.lastVisitTime
      }));
  } catch (err) {
    console.error('Failed to get history:', err);
    return [];
  }
}

/**
 * Refresh cached tabs, bookmarks, and history items based on user settings
 */
async function refreshData(force = false) {
  // If cache is fresh (< 45s) and Fzf instance exists, reuse
  if (!force && Date.now() - lastFetchTime < 45000 && fzfInstance !== null && cachedItems.length > 0) {
    return;
  }

  const settings = await getSettings();

  // Conditionally fetch enabled targets
  const [tabs, bookmarks, history] = await Promise.all([
    settings.enableTabs ? getOpenTabs() : Promise.resolve([]),
    settings.enableBookmarks ? getBookmarks() : Promise.resolve([]),
    settings.enableHistory ? getHistory(settings.historyMonths) : Promise.resolve([])
  ]);

  itemByUrlMap = new Map();

  // Priority order: Open Tabs > Bookmarks > History
  for (const tab of tabs) {
    itemByUrlMap.set(tab.url, tab);
  }
  for (const bm of bookmarks) {
    if (!itemByUrlMap.has(bm.url)) {
      itemByUrlMap.set(bm.url, bm);
    }
  }
  for (const his of history) {
    if (!itemByUrlMap.has(his.url)) {
      itemByUrlMap.set(his.url, his);
    }
  }

  cachedItems = Array.from(itemByUrlMap.values());

  // Initialize Fzf with extendedMatch and Katakana->Hiragana alias for flexible matching
  fzfInstance = new Fzf(cachedItems, {
    selector: (item) => `${item.title} ${katakanaToHiragana(item.title)} ${item.url}`,
    casing: 'case-insensitive',
    match: extendedMatch
  });

  lastFetchTime = Date.now();
}

/**
 * Convert Katakana characters to Hiragana
 */
function katakanaToHiragana(str) {
  if (!str) return '';
  return str.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

/**
 * Convert Hiragana characters to Katakana
 */
function hiraganaToKatakana(str) {
  if (!str) return '';
  return str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
}

/**
 * Check if a string contains Kanji characters
 */
function containsKanji(str) {
  return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(str);
}

/**
 * Perform fzf search with automatic Hiragana/Katakana fallback
 */
function findWithKanaFallback(fzf, query) {
  if (!fzf || !query) return [];
  let results = fzf.find(query);
  if (results && results.length > 0) return results;

  // Fallback 1: If no match, try Katakana -> Hiragana converted query
  const hira = katakanaToHiragana(query);
  if (hira !== query) {
    results = fzf.find(hira);
    if (results && results.length > 0) return results;
  }

  // Fallback 2: If no match, try Hiragana -> Katakana converted query
  const kata = hiraganaToKatakana(query);
  if (kata !== query) {
    results = fzf.find(kata);
    if (results && results.length > 0) return results;
  }

  return [];
}

/**
 * Escape XML special characters for Chrome Omnibox API
 */
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Helper to get user-friendly tag with i18n support
 */
function getTag(type) {
  switch (type) {
    case 'tab': return t('tagTab', '[Tab]');
    case 'bookmark': return t('tagBookmark', '[Bookmark]');
    case 'history': return t('tagHistory', '[History]');
    default: return '';
  }
}

// Invalidate cache on settings change
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    lastFetchTime = 0;
  }
});

// Invalidate cache on tab, bookmark, or history updates
chrome.tabs.onCreated.addListener(() => { lastFetchTime = 0; });
chrome.tabs.onRemoved.addListener(() => { lastFetchTime = 0; });
chrome.tabs.onUpdated.addListener(() => { lastFetchTime = 0; });
chrome.history.onVisited.addListener(() => { lastFetchTime = 0; });
chrome.history.onVisitRemoved?.addListener(() => { lastFetchTime = 0; });
chrome.bookmarks.onCreated.addListener(() => { lastFetchTime = 0; });
chrome.bookmarks.onRemoved.addListener(() => { lastFetchTime = 0; });
chrome.bookmarks.onChanged.addListener(() => { lastFetchTime = 0; });

// On Omnibox activated ("f<space>" or "f<tab>")
chrome.omnibox.onInputStarted.addListener(() => {
  refreshData();
  chrome.omnibox.setDefaultSuggestion({
    description: `<dim>[fzf]</dim> ${escapeXml(t('omniboxPrompt', 'Type keywords to search tabs, bookmarks & history...'))}`
  });
});

// On query text changed
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const seq = ++currentQuerySeq;
  const query = text.trim();
  latestQuery = query;

  if (!query) {
    chrome.omnibox.setDefaultSuggestion({
      description: `<dim>[fzf]</dim> ${escapeXml(t('omniboxPrompt', 'Type keywords to search tabs, bookmarks & history...'))}`
    });
    topResultItem = null;
    return;
  }

  // Only await refreshData if fzf instance is not initialized yet
  if (!fzfInstance || cachedItems.length === 0) {
    await refreshData();
    if (seq !== currentQuerySeq) return;
  }

  if (!fzfInstance || cachedItems.length === 0) {
    chrome.omnibox.setDefaultSuggestion({
      description: `<dim>[fzf]</dim> ${escapeXml(t('omniboxLoading', 'Loading data...'))}`
    });
    return;
  }

  // Execute fzf search synchronously (0ms latency, zero microtask race)
  const results = findWithKanaFallback(fzfInstance, query);
  if (seq !== currentQuerySeq) return;

  if (!results || results.length === 0) {
    chrome.omnibox.setDefaultSuggestion({
      description: `<dim>[fzf]</dim> ${escapeXml(t('omniboxNoMatches', 'No matches found for '))}<match>${escapeXml(query)}</match>`
    });
    topResultItem = null;
    return;
  }

  // Top result (1st match) goes into the default suggestion (selected on Enter)
  const topResult = results[0];
  topResultItem = topResult.item;

  chrome.omnibox.setDefaultSuggestion({
    description: `<dim>${getTag(topResultItem.type)}</dim> <match>${escapeXml(topResultItem.title)}</match> - <url>${escapeXml(topResultItem.url)}</url>`
  });

  // Additional suggestions (up to 5 items)
  const suggestions = [];
  for (let i = 1; i < Math.min(results.length, 6); i++) {
    const item = results[i].item;
    suggestions.push({
      content: item.url,
      description: `<dim>${getTag(item.type)}</dim> <match>${escapeXml(item.title)}</match> - <url>${escapeXml(item.url)}</url>`
    });
  }

  suggest(suggestions);
});

// Navigate or switch tab when an omnibox entry is accepted
chrome.omnibox.onInputEntered.addListener(async (text, disposition) => {
  let targetItem = null;

  if (text.startsWith('http://') || text.startsWith('https://')) {
    targetItem = itemByUrlMap.get(text);
  } else {
    // User pressed Enter on the query text in the Omnibox.
    const inputQuery = text.trim();

    // Determine candidate queries: prioritize Kanji conversion if user converted fast
    const candidateQueries = [];
    if (containsKanji(inputQuery)) {
      candidateQueries.push(inputQuery);
      if (latestQuery && latestQuery !== inputQuery) {
        candidateQueries.push(latestQuery);
      }
    } else if (latestQuery && containsKanji(latestQuery)) {
      // latestQuery has Kanji from IME conversion while inputQuery was pre-composition
      candidateQueries.push(latestQuery);
      if (inputQuery) candidateQueries.push(inputQuery);
    } else {
      if (inputQuery) candidateQueries.push(inputQuery);
      if (latestQuery && latestQuery !== inputQuery) {
        candidateQueries.push(latestQuery);
      }
    }

    // Always perform a fresh search directly with candidate queries
    if (fzfInstance) {
      for (const q of candidateQueries) {
        const results = findWithKanaFallback(fzfInstance, q);
        if (results && results.length > 0) {
          targetItem = results[0].item;
          break;
        }
      }
    }

    // Fallback to topResultItem if direct search found nothing
    if (!targetItem && topResultItem) {
      targetItem = topResultItem;
    }
  }

  // If matched an open tab, switch directly to it!
  if (targetItem && targetItem.type === 'tab') {
    try {
      await chrome.tabs.update(targetItem.tabId, { active: true });
      await chrome.windows.update(targetItem.windowId, { focused: true });
      return;
    } catch (err) {
      console.warn('Tab may have been closed, opening as URL instead:', err);
    }
  }

  // Otherwise, open the URL
  const queryFallback = (latestQuery && containsKanji(latestQuery)) ? latestQuery : text;
  let targetUrl = targetItem ? targetItem.url : text;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://www.google.com/search?q=${encodeURIComponent(queryFallback)}`;
  }

  if (disposition === 'currentTab') {
    chrome.tabs.update({ url: targetUrl });
  } else if (disposition === 'newForegroundTab') {
    chrome.tabs.create({ url: targetUrl, active: true });
  } else if (disposition === 'newBackgroundTab') {
    chrome.tabs.create({ url: targetUrl, active: false });
  }
});

