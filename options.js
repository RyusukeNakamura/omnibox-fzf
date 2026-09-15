const DEFAULT_SETTINGS = {
  enableTabs: true,
  enableBookmarks: true,
  enableHistory: true,
  historyMonths: 1
};

const enableTabsEl = document.getElementById('enableTabs');
const enableBookmarksEl = document.getElementById('enableBookmarks');
const enableHistoryEl = document.getElementById('enableHistory');
const historyMonthsEl = document.getElementById('historyMonths');
const historyMonthsContainer = document.getElementById('historyMonthsContainer');
const historyMonthsDescEl = document.getElementById('historyMonthsDesc');
const allHistoryBadgeEl = document.getElementById('allHistoryBadge');
const unitLabelEl = document.getElementById('unitLabel');
const toastEl = document.getElementById('toast');

let toastTimeout = null;

function t(key, fallback = '') {
  try {
    return chrome.i18n.getMessage(key) || fallback;
  } catch (e) {
    return fallback;
  }
}

// Localize all static elements with data-i18n attribute
function localizePage() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const msg = t(key);
    if (msg) {
      if (el.tagName === 'TITLE') {
        document.title = msg;
      } else {
        el.textContent = msg;
      }
    }
  });
}

function showToast(msg) {
  if (toastEl) {
    toastEl.textContent = msg || t('toastSaved', '設定を保存しました');
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
    }, 1500);
  }
}

function updateHistoryUI() {
  if (enableHistoryEl.checked) {
    historyMonthsContainer.classList.remove('disabled');
    historyMonthsEl.disabled = false;
  } else {
    historyMonthsContainer.classList.add('disabled');
    historyMonthsEl.disabled = true;
  }

  const val = parseInt(historyMonthsEl.value, 10);
  if (val === 0) {
    allHistoryBadgeEl.style.display = 'inline-block';
    historyMonthsDescEl.textContent = t('allHistoryDesc', '全期間の履歴（最大50,000件）を対象にします');
    unitLabelEl.textContent = t('unitAllHistory', '（全履歴）');
  } else {
    allHistoryBadgeEl.style.display = 'none';
    historyMonthsDescEl.textContent = t('settingHistoryDurationDesc', '何ヶ月前までの履歴を対象にするかを指定します（0 = 全履歴・最大5万件）');
    unitLabelEl.textContent = t('unitMonths', 'ヶ月');
  }
}

// Load settings from chrome.storage.sync
async function loadSettings() {
  localizePage();
  try {
    const res = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    enableTabsEl.checked = res.enableTabs !== false;
    enableBookmarksEl.checked = res.enableBookmarks !== false;
    enableHistoryEl.checked = res.enableHistory !== false;
    const months = parseInt(res.historyMonths, 10);
    historyMonthsEl.value = isNaN(months) || months < 0 ? 1 : months;
    updateHistoryUI();
  } catch (e) {
    console.error('Failed to load settings:', e);
  } finally {
    // Reveal UI once layout is fully stabilized
    requestAnimationFrame(() => {
      document.body.classList.add('ready');
    });
  }
}

// Save settings to chrome.storage.sync
async function saveSettings() {
  let months = parseInt(historyMonthsEl.value, 10);
  if (isNaN(months) || months < 0) {
    months = 0;
  }
  historyMonthsEl.value = months;

  const newSettings = {
    enableTabs: enableTabsEl.checked,
    enableBookmarks: enableBookmarksEl.checked,
    enableHistory: enableHistoryEl.checked,
    historyMonths: months
  };

  try {
    await chrome.storage.sync.set(newSettings);
    updateHistoryUI();
    showToast(t('toastSaved', '設定を保存しました'));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', loadSettings);
enableTabsEl.addEventListener('change', saveSettings);
enableBookmarksEl.addEventListener('change', saveSettings);
enableHistoryEl.addEventListener('change', () => {
  updateHistoryUI();
  saveSettings();
});
historyMonthsEl.addEventListener('change', saveSettings);
historyMonthsEl.addEventListener('input', () => {
  updateHistoryUI();
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(saveSettings, 400);
});
