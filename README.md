# jsdigest

可以逛的濃縮版 Stack Overflow，只收 JavaScript。一題一個真實的高票問題 + 幾個重點答案，
排版乾淨好讀，目的是**邊逛邊學**。產出是純靜態網站，免後端、秒開。

> A browsable, condensed Stack Overflow for JavaScript — real top-voted questions with their
> key answers, rendered as a static site for relaxed reading.

## 怎麼跑

```bash
npm run fetch     # 從 Stack Exchange API 撈 javascript 高票題 → data/questions.json
npm run build     # 產生靜態站 → docs/
npm run serve     # 本機預覽 http://127.0.0.1:4480/
npm test          # 單元測試
```

- `npm run fetch` 可重跑：已抓過的題預設跳過，`--refresh` 重抓全部，`--count N` 指定題數。
- 更新內容 = 重跑 `fetch` + `build`。

## 設定（選用，`.env`）

| 變數 | 預設 | 說明 |
|---|---|---|
| `SO_API_KEY` | 無 | Stack Exchange API key（選用，有的話額度從 300/日 升到 10000/日；非密鑰） |
| `FETCH_COUNT` | 200 | 撈幾題 |
| `ANSWERS_PER_QUESTION` | 3 | 每題留幾個重點答案 |
| `SITE_TITLE` / `SITE_TAGLINE` | jsdigest / … | 站名與標語 |

## 部署

靜態站，`docs/` 直接丟 GitHub Pages（serve 自 `/docs`）或任何靜態主機。

## 授權與來源

題目與答案來自 [Stack Overflow](https://stackoverflow.com)，依
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 使用；每題與每則答案都附回原文與作者連結。
本站為個人學習用的濃縮閱讀站，非 Stack Overflow 官方。產生器程式碼為 MIT。
