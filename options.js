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

function showToast(msg) {
  if (toastEl) {
    toastEl.textContent = msg;
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
    historyMonthsDescEl.textContent = '全期間の履歴（最大50,000件）を対象にします';
    unitLabelEl.textContent = '（全履歴）';
  } else {
    allHistoryBadgeEl.style.display = 'none';
    historyMonthsDescEl.textContent = '何ヶ月前までの履歴を対象にするかを指定します（0 = 全履歴・最大5万件）';
    unitLabelEl.textContent = 'ヶ月';
  }
}

// Load settings from chrome.storage.sync
async function loadSettings() {
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
    showToast('設定を保存しました');
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
