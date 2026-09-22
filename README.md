# omnibox-fzf

[English | [日本語](README.ja.md)]

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/hkanmbmmkploagcbeclbaflbflbnepcm?logo=googlechrome&logoColor=white&label=Chrome%20Web%20Store)](https://chromewebstore.google.com/detail/omnibox-fzf-tabs-bookmark/hkanmbmmkploagcbeclbaflbflbnepcm)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/hkanmbmmkploagcbeclbaflbflbnepcm)](https://chromewebstore.google.com/detail/omnibox-fzf-tabs-bookmark/hkanmbmmkploagcbeclbaflbflbnepcm)
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/hkanmbmmkploagcbeclbaflbflbnepcm)](https://chromewebstore.google.com/detail/omnibox-fzf-tabs-bookmark/hkanmbmmkploagcbeclbaflbflbnepcm)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Browser address bar extension for fast fuzzy searching open tabs, bookmarks, and browsing history using the fzf algorithm.

A lightweight extension for Chromium-based browsers (Chrome, Brave, Edge, etc.) that brings fzf-powered search directly into your omnibox (address bar).

## Features

- **Fuzzy Search**: Powered by `fzf-for-js`, providing fast subsequence and substring matching. Full support for English, Japanese (Kanji, Hiragana, Katakana), and multi-word space-delimited AND queries.
- **Tab Switching**: Search across all currently open tabs (`[Tab]`) and switch focus directly without opening duplicate pages.
- **Bookmarks & History**: Unified search across saved bookmarks (`[Bookmark]`) and recent browsing history (`[History]`).
- **Configurable**: Individually enable or disable tabs, bookmarks, or history. Customize the history lookback window (0 for all-time history with a 50k safety cap, or 1–60 months).
- **Offline & Private**: Zero network requests. All indexing and search operations run entirely in-memory on your local machine.

## Usage

1. Focus the address bar (`Ctrl + L` / `Cmd + L` / `Alt + D`).
2. Type `f` and press `Space` or `Tab`.
3. Type keywords to search.
   - Press `Enter`: Jump immediately to the top result (or switch to that tab).
   - Use `↑` / `↓` arrows to select a result and press `Enter`.

## Search Syntax (fzf Extended Match)

`omnibox-fzf` supports standard fzf extended search syntax:

| Pattern | Match type | Description |
| :--- | :--- | :--- |
| `term` | Fuzzy | Subsequence match (standard fzf fuzzy matching) |
| `'term` | Exact-match | Substring match (disables fuzzy matching for this term) |
| `!term` | Inverse-match | Exclude items containing this term |
| `^term` | Prefix-match | Items starting with term |
| `term$` | Suffix-match | Items ending with term |
| `a b` | AND match | Match items containing both `a` and `b` in any order |

**Example**: `f github !wiki` matches items with `github` while excluding any containing `wiki`.

## Installation

### Chrome Web Store (Recommended)

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/omnibox-fzf-tabs-bookmark/hkanmbmmkploagcbeclbaflbflbnepcm).

### Install from Source (Developer mode)

1. Clone or download this repository.
2. Open your browser's extension manager:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** in the top-left corner.
5. Select this directory (`omnibox-fzf`).

## Configuration

Right-click the extension icon and select **Options**, or navigate to **Details** -> **Extension options** from the extension management page.

- **Open Tabs**: Enable / Disable
- **Bookmarks**: Enable / Disable
- **Browsing History**: Enable / Disable
- **History Duration**: Number of months (0: all-time history, 1–60: specific months)

Settings are automatically persisted and synchronized via `chrome.storage.sync`.

## Privacy

This extension does not collect, track, transmit, or sell your browsing history, bookmarks, or open tabs. All data stays strictly within your browser's local memory.

## License

MIT License - Copyright (c) 2026 Ryusuke Nakamura
