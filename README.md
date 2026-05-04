# 3BLD(3 style & letter pairs) practice

A bilingual browser-based practice tool for 3BLD.
It helps you manage letter pair words, review 3-style algorithms, and train recall with flashcards and typing tests.

[Traditional Chinese / 繁體中文](#繁體中文)

## Demo

- Live site: [3BLD(3 style & letter pairs) practice](https://charlesouo.github.io/Blindfolded-Letter-Pairs/)

## Overview

This project is designed for 3BLD practice in the browser.
You can use it to:

- store `Words` for letter pairs
- review `Corners` algorithms
- review `Edges` algorithms
- practice with flashcards
- train recall speed with typing tests
- export and import your own local data

It is a fully static website with no backend required.

## Default Setup

- Default lettering scheme: `Speffz`
- Built-in algorithm source: [BLDDB](https://blddb.net/)
- Built-in algorithm format: `commutator-first`
- Default built-in buffer mapping: Speffz `C` buffer
- Built-in corner and edge references are stored locally in this project

`Speffz` is only the default.
If you use a different lettering scheme, you can directly edit the row and column headers in `Table` mode and replace the default scheme with your own.

## Notation

- Conjugate (setup): `[A: B] = A B A'`
- Commutator: `[A, B] = A B A' B'`
- Combination: `[A: [B, C]] = A B C B' C' A'`
- Example: `[R2': [E, R U' R']] = R2' E R U' R' E' R U R`

## Main Features

### 1. List Input

- switch between `List` and `Table` layouts
- switch between `Words` and `Algorithm`
- edit `Corners` and `Edges` separately
- directly edit table headers to use your own lettering scheme
- use familiarity colors for quick review management

### 2. Built-in Algorithm References

- built-in defaults are derived from `BLDDB`
- no runtime fetch is required
- empty algorithm fields can show built-in placeholders
- corner and edge algorithms can be reviewed separately in flashcards

### 3. Flashcards

- practice `Words`, `Corners`, and `Edges`
- review due cards with spaced-repetition style scheduling
- grade cards as `Hard`, `Slow`, or `Good`
- if no card is due, the app falls back to the earliest upcoming cards

Review timing:

- `Hard`: due again in 10 minutes
- `Slow`: due again in 6 hours
- `Good`: scheduled with day-based spacing

### 4. Typing Test

- practice `Words` with a timer
- filter by start and end ranges
- test results update the same familiarity and scheduling data

### 5. Backup and Restore

- export a full `.json` backup
- export the word table as `.csv`
- import previous backups

Backup data includes:

- word data
- corner algorithms
- edge algorithms
- familiarity and review state
- custom lettering scheme
- saved language setting

## How To Use

1. Open `List Input`
2. Fill in your `Words`
3. Switch to `Algorithm` and enter `Corners` or `Edges`
4. If needed, switch to `Table` mode and replace the default `Speffz` headers with your own lettering scheme
5. Use `Flashcards` for review
6. Use `Typing Test` for speed practice
7. Export a `.json` backup regularly

## Data Storage

- all user data is stored in browser `localStorage`
- clearing browser site data will remove local progress if you do not have a backup
- built-in algorithm defaults are loaded from `built-in-algorithms.js`

## Deployment

This project can be deployed as a static site on:

- GitHub Pages
- Netlify
- Cloudflare Pages

No server or database is required.

## License

This project is licensed under `GPL-3.0-or-later`.

- Full license text: [LICENSE](./LICENSE)
- Built-in algorithm data in this project is derived from [BLDDB](https://blddb.net/)
- BLDDB documents its license as `GPL version 3 or later`

## Author

- Author: Charles Lin
- WCA ID: [2020LINC05](https://www.worldcubeassociation.org/persons/2020LINC05)
- GitHub: [Blindfolded-Letter-Pairs](https://github.com/CharlesOuO/Blindfolded-Letter-Pairs)
- Instagram: [@chihjialin](https://www.instagram.com/chihjialin/)
- Email: [linchihjia@gmail.com](https://mail.google.com/mail/?view=cm&fs=1&to=linchihjia@gmail.com)

---

# 繁體中文

## 3BLD(3 style & letter pairs) practice

這是一個在瀏覽器中使用的 3BLD 練習工具。
你可以用它管理 letter pairs 字詞、複習 3-style 公式，並透過字卡和打字測驗訓練記憶與反應速度。

## Demo

- 網站連結：[3BLD(3 style & letter pairs) practice](https://charlesouo.github.io/Blindfolded-Letter-Pairs/)

## 專案簡介

這個專案主要用來做 3BLD 練習，你可以用它來：

- 紀錄 letter pairs 的 `Words`
- 複習 `Corners` 公式
- 複習 `Edges` 公式
- 使用字卡練習
- 使用打字測驗訓練反應速度
- 匯出與匯入自己的本機資料

這是一個純靜態網站，不需要後端。

## 預設設定

- 預設 lettering scheme：`Speffz`
- 內建公式來源：[BLDDB](https://blddb.net/)
- 內建公式顯示格式：`commutator-first`
- 內建預設 buffer 映射：Speffz `C` buffer
- 內建的 corners 和 edges 公式參考已直接存放在專案內

`Speffz` 只是預設值。
如果你使用自己的 lettering scheme，可以直接在 `Table` 模式修改列與欄標頭，把預設 scheme 改成你自己的。

## Notation

- Conjugate（setup）：`[A: B] = A B A'`
- Commutator：`[A, B] = A B A' B'`
- Combination：`[A: [B, C]] = A B C B' C' A'`
- Example：`[R2': [E, R U' R']] = R2' E R U' R' E' R U R`

## 主要功能

### 1. List Input

- 可切換 `List` 與 `Table` 版面
- 可切換 `Words` 與 `Algorithm`
- 可分開編輯 `Corners` 與 `Edges`
- 可直接修改表頭，改成自己的 lettering scheme
- 可搭配熟悉度顏色做快速管理

### 2. 內建公式參考

- 內建預設公式根據 `BLDDB` 資料整理
- 不需要在執行時另外抓取資料
- 當公式欄位為空時，可以顯示內建 placeholder
- corners 與 edges 可以分開在字卡中複習

### 3. Flashcards

- 可練習 `Words`、`Corners`、`Edges`
- 使用類 spaced repetition 的到期排程
- 可將卡片評分為 `Hard`、`Slow`、`Good`
- 如果目前沒有到期卡片，系統會改抽最近即將到期的卡

複習時間規則：

- `Hard`：10 分鐘後再次到期
- `Slow`：6 小時後再次到期
- `Good`：依天數間隔排程

### 4. Typing Test

- 使用計時器練習 `Words`
- 可依開頭與結尾範圍過濾
- 測驗結果會更新同一套熟悉度與排程資料

### 5. 備份與還原

- 可匯出完整 `.json` 備份
- 可匯出 `Words` 表格為 `.csv`
- 可匯入舊備份

備份內容包含：

- 字詞資料
- corner 公式
- edge 公式
- 熟悉度與複習進度
- 自訂 lettering scheme
- 已儲存的語言設定

## 使用方式

1. 開啟 `List Input`
2. 輸入你的 `Words`
3. 切到 `Algorithm` 輸入 `Corners` 或 `Edges`
4. 如果需要，切到 `Table` 模式，把預設 `Speffz` 表頭改成自己的 lettering scheme
5. 到 `Flashcards` 做複習
6. 到 `Typing Test` 做速度訓練
7. 定期匯出 `.json` 備份

## 資料儲存

- 所有使用者資料都存放在瀏覽器 `localStorage`
- 如果沒有先備份，清除瀏覽器站點資料後，本機進度會消失
- 內建公式預設由 `built-in-algorithms.js` 提供

## 部署方式

這個專案可以直接部署成靜態網站，例如：

- GitHub Pages
- Netlify
- Cloudflare Pages

不需要伺服器或資料庫。

## 授權

本專案採用 `GPL-3.0-or-later` 授權。

- 完整授權條文請見 [LICENSE](./LICENSE)
- 專案中的內建公式資料是根據 [BLDDB](https://blddb.net/) 整理而成
- BLDDB 官方文件標示其授權為 `GPL version 3 or later`

## 作者資訊

- Author: Charles Lin
- WCA ID: [2020LINC05](https://www.worldcubeassociation.org/persons/2020LINC05)
- GitHub: [Blindfolded-Letter-Pairs](https://github.com/CharlesOuO/Blindfolded-Letter-Pairs)
- Instagram: [@chihjialin](https://www.instagram.com/chihjialin/)
- Email: [linchihjia@gmail.com](https://mail.google.com/mail/?view=cm&fs=1&to=linchihjia@gmail.com)
