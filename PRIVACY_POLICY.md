# Privacy Policy for "omnibox-fzf"

Last updated: September 15, 2026

"omnibox-fzf - Tabs, Bookmarks & History Search" (the "Extension") is committed to respecting and protecting your privacy. This Privacy Policy explains how our Extension handles your information.

## 1. Information Collection and Storage
**We do NOT collect, transmit, sell, or store any personal data, open tabs, or browsing history outside your device.**

- **Open Tabs (`tabs` permission):** The Extension accesses your currently open tabs list strictly in-memory within your local browser environment to allow you to search and switch between existing tabs.
- **Bookmarks (`bookmarks` permission):** The Extension accesses your bookmarks list strictly in-memory within your local browser environment to allow you to search and jump to bookmarked pages.
- **Browsing History (`history` permission):** The Extension accesses your browsing history strictly in-memory within your local browser environment based on your configured duration (default: 1 month) to provide fast fuzzy search directly from the omnibox.
- **Settings Storage (`storage` permission):** The Extension uses `chrome.storage.sync` strictly to persist your preferences (which search targets to enable and the history month range). No personal data or browsing content is ever stored in sync storage.

None of your tab data, bookmark data, or browsing history ever leaves your local computer.

## 2. Network Communications
The Extension makes **zero network requests**. It operates 100% offline and in-memory within your browser instance.

## 3. Third-Party Services
The Extension does not integrate with any analytics providers, advertising networks, or external tracking services.

## 4. Contact
If you have any questions regarding this Privacy Policy, please open an issue on the GitHub repository.

---

# プライバシーポリシー（日本語要約）

最終更新日: 2026年9月15日

「omnibox-fzf - Tabs, Bookmarks & History Search」（以下「本拡張機能」）は、ユーザーのプライバシーを尊重し、個人情報の保護に最大限努めます。

### 1. データの収集および送信について
**本拡張機能は、開いているタブ、個人情報、閲覧履歴、ブックマーク情報を一切外部サーバー等へ送信・収集・保存しません。**

- **開いているタブ（`tabs` 権限）:** アドレスバーから現在開いているタブを検索・切り替える目的でのみ利用されます。
- **ブックマーク（`bookmarks` 権限）:** 保存済みのブックマークを検索する目的でのみ利用されます。
- **閲覧履歴（`history` 権限）:** 設定された期間（デフォルト1ヶ月）の閲覧履歴をあいまい検索する目的でのみ利用されます。
- **設定の保存（`storage` 権限）:** ユーザーの検索対象のON/OFFや期間設定をブラウザ間で同期保存するためにのみ利用されます。

### 2. 外部通信について
本拡張機能は、外部サーバーへの通信（APIリクエスト、アナリティクス、トラッキング等）を一切行いません。完全オフライン・ローカル完結で動作します。
