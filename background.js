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

  // Initialize Fzf with extendedMatch
  fzfInstance = new Fzf(cachedItems, {
    selector: (item) => `${item.title} ${item.url}`,
    casing: 'case-insensitive',
    match: extendedMatch
  });

  lastFetchTime = Date.now();
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
 * Helper to get user-friendly tag
 */
function getTag(type) {
  switch (type) {
    case 'tab': return '[Tab]';
    case 'bookmark': return '[Bookmark]';
    case 'history': return '[History]';
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
    description: '<dim>[fzf]</dim> 検索キーワードを入力（タブ・ブックマーク・履歴）...'
  });
});

// On query text changed
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const query = text.trim();
  if (!query) {
    chrome.omnibox.setDefaultSuggestion({
      description: '<dim>[fzf]</dim> 検索キーワードを入力（タブ・ブックマーク・履歴）...'
    });
    topResultItem = null;
    return;
  }

  await refreshData();

  if (!fzfInstance || cachedItems.length === 0) {
    chrome.omnibox.setDefaultSuggestion({
      description: '<dim>[fzf]</dim> データを読み込み中（または検索対象がすべて無効です）...'
    });
    return;
  }

  // Execute fzf search
  const results = fzfInstance.find(query);

  if (!results || results.length === 0) {
    chrome.omnibox.setDefaultSuggestion({
      description: `<dim>[fzf]</dim> 一致する結果がありません: <match>${escapeXml(query)}</match>`
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
  } else if (topResultItem) {
    targetItem = topResultItem;
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
  let targetUrl = targetItem ? targetItem.url : text;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
  }

  if (disposition === 'currentTab') {
    chrome.tabs.update({ url: targetUrl });
  } else if (disposition === 'newForegroundTab') {
    chrome.tabs.create({ url: targetUrl, active: true });
  } else if (disposition === 'newBackgroundTab') {
    chrome.tabs.create({ url: targetUrl, active: false });
  }
});
