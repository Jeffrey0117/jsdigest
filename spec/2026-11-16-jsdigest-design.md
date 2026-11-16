# jsdigest 設計

2026-11-16

## 這是什麼（intent / why）

一個**可以逛的、濃縮版 StackOverflow（只收 JavaScript）**。使用者（Jeff，以及任何公開來訪的人）
像逛論壇一樣一題一題看：每題一個真實的 JS 問題 + 幾個重點答案，排版乾淨好讀，目的是「邊逛邊學」。

被勾到的原始體驗：SO 頁面側邊那串「Related」——一排帶票數的真實熱門 JS 問題。那本質上是一張
「JS 常見真實問題」熱度排行，jsdigest 就是把它變成一個專門拿來逛的地方。

## 目標 / 非目標

**目標**
- 真實 SO 內容（JavaScript 高票題），不是自己生的教材。
- 逛的手感：列表一排題目（標題＋票數＋標籤＋摘要），點進去看題目 + 重點答案。
- 乾淨好讀，手機也能逛。
- 公開；合規標註 CC-BY-SA 來源（每題附回 SO 原文連結與作者）。
- 靜態站：免後端、秒開、零維護；更新＝重跑腳本重生。

**非目標（anti-goals）**
- 不是練習工具：站上不寫 code、不跑 code、不做測驗。
- 不花按量計費的 API 錢：答案「只留重點」用**原樣精選**，不做 AI 摘要（之後想要再開，另案）。
- 第一版不做中文化（SO 原文是英文，先照原文）。
- 不做使用者帳號、留言、投票（它是唯讀的濃縮閱讀站，不是社群）。

## 約束
- 零第三方執行期依賴（Jeff 慣例）。Node 內建跑腳本即可。
- 密鑰讀 env、缺就失敗；但 SO API key 非必要（keyless 也能跑，只是額度低），因此設為**選用**。
- 不把 Jeff 的個資送往外部服務；對 SO API 只送標籤查詢，User-Agent 用通用名稱。
- 公開站 → 標註來源（CC-BY-SA 要求姓名標示 + 連回）。

## 做法（approaches，已選定）
- 資料來源：**A — 真實 StackExchange API**（相對於 B 自己策展、C AI 生成）。選 A 是因為要的就是真實熱門題的感覺，且不用自己生內容。
- 站形態：**靜態站**（相對於小後端服務）。選靜態是因為「逛著學」只需唯讀、要秒開免維護、好公開。
- 答案濃縮：**原樣精選**（相對於 AI TL;DR）。只顯示被採納 + 最高票答案，長的收合可展開；零成本、最忠實、不碰計費 API。

## 架構

兩個階段，中間隔著一包 `data/questions.json`：

```
fetch 腳本 ──(StackExchange API)──▶ data/questions.json ──build 腳本──▶ docs/（靜態站）
```

### ① fetch（`npm run fetch`）
- 撈 `tagged=javascript&sort=votes` 的高票題（可設數量，預設 ~200）。
- 每題再撈它的答案（`sort=votes`，含 body），取被採納 + 最高票，最多留前 3。
- 尊重 API 的 `backoff` 與 `quota_remaining`；keyless 300/日、有 key 10000/日。
- 輸出 `data/questions.json`：精簡後的題目與答案（含作者、連結、分數、標籤）。
- **可重跑、可增量**：已抓過的題預設跳過，除非 `--refresh`。

### ② build（`npm run build`）
- 讀 `data/questions.json`，渲染靜態站到 `docs/`：
  - `docs/index.html`：題目列表（標題、票數、標籤、答數、一句摘要）。頁內嵌精簡 metadata → 前端即時搜尋 / 標籤過濾（純 client JS，無後端）。
  - `docs/q/<id>.html`：單題頁 = 題目本文 + 重點答案（被採納優先、最高票次之），每段附作者 + 回 SO 連結。長答案收合可展開。
  - `docs/assets/style.css`、`docs/assets/app.js`（列表搜尋/過濾）。
- 每頁頁尾固定一行 CC-BY-SA 來源聲明 + 連回 SO。
- `build` 會清掉並重生 `docs/`（source 一律不放 docs/）。

### 內容安全
- SO body 是它已清理過的 HTML。靜態預渲染、無使用者輸入；嵌入前防禦性移除 `<script>`。公開站風險低。

## 設計口味（依 Jeff 既有偏好）
- 整頁單一底色，不要段落交替明暗、不要段落背景圖。
- 灰階為主，顏色只給有意義的數字（票數高亮）。零值灰顯。
- 不用 emoji 當徽章。
- icon 用高質感 icon（需要時），不用 emoji。

## 檔案（都 <400 行）
- `package.json`：scripts = fetch / build / serve；零 runtime 依賴。
- `src/config.js`：讀 `.env`（`SO_API_KEY?`、`SITE_TITLE`、`BASE_PATH`、`FETCH_TAG`、`FETCH_COUNT`）。
- `src/so-api.js`：API 請求、分頁、backoff。
- `src/fetch-questions.js`：撈題 + 撈答 → `data/questions.json`。
- `src/html.js`：escape / 截斷 / 去 script / 格式化。
- `src/render.js`：index 與 detail 的 HTML 模板。
- `src/build.js`：讀 data → 渲染 → 寫 docs。
- `assets/style.css`、`assets/app.js`：複製進 docs。
- `.repo`、`README.md`、`.gitignore`（`.env`、`node_modules`）。

## 部署
- 公開 GitHub Pages，serve 自 `/docs`。倉庫 `Jeffrey0117/jsdigest`（公開）。
- 之後要自訂網域再接 CloudPipe。

## 留給實作者
- API 實際欄位 / filter 以第一次真打為準（先小量測，再放大）。
- 列表預設排序 = 票數；標籤過濾清單由資料裡出現的標籤生成。
- 答案收合門檻（字數）實作時抓一個順眼的值。
