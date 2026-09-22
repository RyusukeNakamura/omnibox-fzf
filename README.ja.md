# omnibox-fzf

[[English](README.md) | 日本語]

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/hkanmbmmkploagcbeclbaflbflbnepcm?logo=googlechrome&logoColor=white&label=Chrome%20Web%20Store)](https://chromewebstore.google.com/detail/omnibox-fzf-tabs-bookmark/hkanmbmmkploagcbeclbaflbflbnepcm)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/hkanmbmmkploagcbeclbaflbflbnepcm)](https://chromewebstore.google.com/detail/omnibox-fzf-tabs-bookmark/hkanmbmmkploagcbeclbaflbflbnepcm)
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/hkanmbmmkploagcbeclbaflbflbnepcm)](https://chromewebstore.google.com/detail/omnibox-fzf-tabs-bookmark/hkanmbmmkploagcbeclbaflbflbnepcm)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

ブラウザのアドレスバーで、開いているタブやブックマーク、閲覧履歴を fzf 検索できる拡張機能です。キーボードから手を離さずに、目的のページをすぐに見つけられます。

Chrome、Brave、Microsoft Edge などの Chromium 系ブラウザに対応しています。外部通信は一切行いません。手元のメモリ内だけで軽快に動きます。設定も最小限です。すぐ使えます。

## 特徴

- **あいまい検索**: 本家 fzf の公式移植（`fzf-for-js`）を採用しています。英数字はもちろん、漢字やひらがな、カタカナに対応。空白で区切った複数単語の AND 検索もそのまま動きます。
- **タブ切り替え**: 開いている全タブ（`[Tab]`）を対象に探せます。選んだタブへその場でフォーカスが移るため、同じページを重複して開く無駄がありません。
- **ブックマークと履歴の横断検索**: 保存したブックマーク（`[Bookmark]`）と過去の閲覧履歴（`[History]`）をまとめて探せます。
- **対象と期間の調整**: タブ、ブックマーク、履歴を個別にオン・オフできます。履歴の取得期間も自由に指定でき、`0` を設定すれば全期間（上限5万件）が対象になります。
- **安心のローカル完結**: 閲覧履歴やタブ情報を外部サーバーへ送ることは一切ありません。完全にオフラインで動作します。

## 使い方

操作は直感的です。

1. アドレスバーにカーソルを合わせます（ショートカットは `Ctrl + L`、`Cmd + L`、または `Alt + D` です）。
2. `f` を入力して `Space` または `Tab` キーを押します。
3. 探したい単語を入力します。
   - そのまま `Enter`: 1番上の候補が開きます。タブならそのタブへ即座に切り替わります。
   - `↑` / `↓` キーで選択して `Enter`: 選んだ項目を開きます。

## 検索テクニック（fzf 拡張検索構文）

本拡張機能は、ターミナルの fzf と同様の拡張検索構文（`extendedMatch`）に標準で対応しています。

| パターン | 一致形式 | 説明 |
| :--- | :--- | :--- |
| `term` | あいまい検索 | 通常の fzf あいまい一致（部分列検索） |
| `'term` | 完全一致 | あいまい検索を行わず、その文字列を含むものを探す（先頭に `'`） |
| `!term` | 除外（NOT） | 指定した単語を含まないものを抽出（先頭に `!`） |
| `^term` | 前方一致 | 指定した単語から始まるものを検索 |
| `term$` | 後方一致 | 指定した単語で終わるものを検索 |
| `a b` | AND 検索 | 空白区切りで複数の条件をすべて満たすものを検索（順不同） |

**使用例**:
`f github !wiki` と入力すると、「`github` を含み、かつ `wiki` を含まない」タブや履歴を絞り込めます。

## インストール手順

### Chrome ウェブストア（推奨）

[Chrome ウェブストア](https://chromewebstore.google.com/detail/omnibox-fzf-tabs-bookmark/hkanmbmmkploagcbeclbaflbflbnepcm) からワンクリックでインストールできます。

### 開発版の手動インストール

1. このリポジトリをクローンまたはダウンロードします。
2. ブラウザで拡張機能の管理画面を開きます。
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
3. 右上の **デベロッパーモード** をオンにします。
4. 左上の **パッケージ化されていない拡張機能を読み込む** をクリックします。
5. このリポジトリのフォルダ（`omnibox-fzf`）を選択します。これだけで完了です。

## 設定

設定の変更も手軽です。拡張機能のアイコンを右クリックして「オプション」を開くか、管理画面の「詳細」→「拡張機能のオプション」から変更できます。

- 開いているタブの検索（オン / オフ）
- ブックマークの検索（オン / オフ）
- 閲覧履歴の検索（オン / オフ）
- 履歴の取得期間（`0`: 全期間、`1`〜`60`: 月数）

設定内容は `chrome.storage.sync` に保存され、ブラウザ間で自動的に同期されます。

## プライバシー

本拡張機能は、ユーザーの閲覧履歴、ブックマーク、開いているタブの情報を外部サーバーへ収集・送信・保存しません。すべてのデータ処理はブラウザのメモリ内でのみ行われます。

## ライセンス

MIT License - Copyright (c) 2026 Ryusuke Nakamura
