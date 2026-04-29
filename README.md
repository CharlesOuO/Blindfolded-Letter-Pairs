# Blindfolded Letter Pairs Practice

Letter pair practice for blindfolded solving, with bilingual UI, flashcards, typing test, table editing, and built-in algorithm references for corners and edges.

[Traditional Chinese version / 繁體中文版](#繁體中文版)

## Overview

This project helps BLD solvers manage and review:

- `Words` for letter pairs
- `Corners` algorithms
- `Edges` algorithms

It supports custom coding systems, range-based practice, local backup/import, and built-in default commutators derived from BLDDB for algorithm study.

## Features

### 1. List Input

- Switch between `List` and `Table` layouts
- Switch between `Words` and `Algorithm`
- Under `Algorithm`, edit `Corners` and `Edges` separately
- Built-in BLDDB defaults appear as placeholders when your own algorithm field is empty
- Table cells support familiarity colors and quick editing

### 2. Flashcards

- Practice `Words`, `Corners`, and `Edges` separately or together
- When multiple modes are enabled, flashcards use the shared eligible set for those modes
- Answers show each enabled content block that exists for that pair
- Review scheduling is due-date based

Current review timing:

- `Hard`: due again in 10 minutes
- `Slow`: due again in 6 hours
- `Good`: scheduled by day-based spaced repetition

If no card is currently due, the app falls back to the earliest upcoming cards and tries to avoid repeating the same card within the last 5 flashcards.

### 3. Typing Test

- Practice `Words` with a timer
- Filter by start and end ranges
- Results update the same familiarity / scheduling data

### 4. Built-in Algorithms

- Built-in defaults are stored locally in the project
- No runtime fetch is required
- Current source: [BLDDB](https://blddb.net/)
- Current notation: `commutator-first`
- Current buffer mapping used for built-in pair defaults: Speffz `C` buffer

### 5. Backup and Restore

- Export backup as `.json`
- Export word table as `.csv`
- Import previous backups
- Backup includes:
  - word data
  - corner algorithms
  - edge algorithms
  - familiarity / review state
  - custom character set

## Quick Start

1. Open `List Input`
2. Fill in your `Words`
3. Switch to `Algorithm` and fill in `Corners` / `Edges` as needed
4. Use `Flashcards` for review
5. Use `Typing Test` for word recall speed
6. Export a `.json` backup regularly

## Tech Notes

- Data is stored in browser `localStorage`
- Built-in algorithm defaults are loaded from `built-in-algorithms.js`
- The UI supports English and Traditional Chinese

## Author

- Author: Charles Lin
- WCA ID: [2020LINC05](https://www.worldcubeassociation.org/persons/2020LINC05)
- Demo: [Blindfolded Letter Pairs Website](https://charlesouo.github.io/Blindfolded-Letter-Pairs/)

---

# 繁體中文版

這是一個給盲解使用者練習 `Letter Pairs`、`Corners`、`Edges` 的網頁工具，支援中英文介面、字卡、打字測驗、表格式編輯，以及內建的 BLDDB 公式參考。

## 功能簡介

### 1. List Input

- 可切換 `List` / `Table`
- 可切換 `Words` / `Algorithm`
- `Algorithm` 底下再分成 `Corners` 與 `Edges`
- 若你沒有自己輸入公式，會先顯示內建的 BLDDB commutator placeholder
- 表格模式可直接編輯，並搭配熟悉度顏色管理

### 2. Flashcards

- 可分別練習 `Words`、`Corners`、`Edges`
- 也可以同時開多個模式一起練
- 翻卡時會顯示該 pair 對應的內容
- 抽卡邏輯改為 `due date` 制

目前複習時間規則：

- `Hard`：10 分鐘後再次到期
- `Slow`：6 小時後再次到期
- `Good`：依天數間隔排程

若目前沒有任何卡已到期，系統會先挑最近即將到期的卡，並盡量避免最近 5 張內重複出現同一張。

### 3. Typing Test

- 目前主要用來練 `Words`
- 可用起始 / 結束範圍過濾
- 測驗結果會更新同一套熟悉度與排程資料

### 4. 內建公式

- 公式已經直接存在專案內，不需要每次上網抓
- 目前來源是 [BLDDB](https://blddb.net/)
- 目前預設顯示格式為 `commutator-first`
- 目前 pair 預設映射使用 Speffz `C` buffer

### 5. 備份與還原

- 可匯出 `.json` 備份
- 可匯出 `.csv` 字詞表
- 可匯入舊備份

備份內容包含：

- 字詞資料
- corner 公式
- edge 公式
- 熟悉度 / 複習進度
- 自訂字元集

## 使用方式

1. 在 `List Input` 輸入 `Words`
2. 切到 `Algorithm` 補上 `Corners` / `Edges`
3. 到 `Flashcards` 進行複習
4. 到 `Typing Test` 練習字詞反應速度
5. 定期匯出 `.json` 備份

## 技術補充

- 資料存於瀏覽器 `localStorage`
- 內建公式由 `built-in-algorithms.js` 提供
- 介面支援英文與繁體中文

## 作者資訊

- Author: Charles Lin
- WCA ID: [2020LINC05](https://www.worldcubeassociation.org/persons/2020LINC05)
- Demo: [Blindfolded Letter Pairs Website](https://charlesouo.github.io/Blindfolded-Letter-Pairs/)
