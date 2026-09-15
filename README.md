# omnibox-fzf

[English | [日本語](README.ja.md)]

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

## Installation (Unpacked)

1. Open your browser's extension manager:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** in the top-left corner.
4. Select this directory (`omnibox-fzf`).

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
