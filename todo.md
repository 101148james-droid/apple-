# App Store 內購價格比較工具 TODO

## 後端
- [x] 資料庫 Schema：search_history 表
- [x] 後端爬蟲：從各國 App Store 網頁抓取內購價格
- [x] 後端 API：搜尋遊戲（iTunes Search API）
- [x] 後端 API：查詢各國內購價格（多國並行爬取）
- [x] 後端 API：即時匯率換算（換算成 TWD）
- [x] 後端 API：儲存查詢歷史記錄
- [x] 後端 API：取得歷史查詢記錄列表
- [x] 後端 API：刪除歷史記錄

## 前端
- [x] 全域樣式設計（簡潔工具風格，深色主題）
- [x] 首頁：搜尋框（支援遊戲名稱或 App ID）
- [x] 搜尋結果列表：顯示遊戲縮圖、名稱、開發商
- [x] 比價頁面：選擇遊戲後顯示各國內購價格比較表格
- [x] 比價表格：標示最便宜國家（綠色高亮）
- [x] 比價表格：顯示原始價格 + 換算台幣
- [x] 比價表格：按台幣金額排序
- [x] 載入中狀態（進度指示器）
- [x] 歷史查詢記錄側欄/列表
- [x] 響應式設計（手機友善）

## 測試
- [x] 後端 API 單元測試
- [x] 匯率換算邏輯測試

## 擴充（2026-04-03）
- [x] 加入所有 App Store 支援的國家/地區（130+ 個）
- [x] 更新匯率備用資料涵蓋所有貨幣
- [x] 前端 UI 適應大量國家的比價結果顯示（地區篩選、展開/收合）

## Bug 修復（2026-04-03）
- [x] 修復查詢結果後出現的 React DOM insertBefore 錯誤（NotFoundError）

## Bug 修復（2026-04-03 第二批）
- [x] 修復特殊格式價格解析失敗（Rp 85ribu、USD 4.99 等）導致換算台幣為 NT$0（加入 detectCurrencyFromPrice + 改進 parsePrice）
- [x] 修復爬蟲只抓到少數國家資料（CSS selector 改為 [class*="text-pair"]，支援 svelte hash class）

## Bug 修復（2026-04-03 第三批）
- [x] 修復後置貨幣代碼格式（0,49 USD）解析失敗導致 NT$0
- [x] 修復後置貨幣符號格式（0,39 €）解析失敗導致 NT$0
- [x] 修復 $0.39 美元符號在非 USD 國家應偵測為 USD 計價

## Bug 修復（第四批）
- [x] 修復跨瀏覽器 DOM 渲染錯誤：加強 Error Boundary + 防外掛 DOM 干擾
- [x] 修復同商品分組邏輯：用數字提取合併同面額商品（400 WC / 월드코인 400개 → 同組）
- [x] 修復逗號小數點格式解析失敗（1,99 $US → NT$0）（加入 NBSP 清洗 + $US 非標準代碼對應）

## Bug 修復（第五批）
- [x] 確認所有外部 API 請求都在後端執行（無前端直接 fetch 外部 URL）
- [x] 修復靜默失敗：搜尋/查詢失敗時顯示明確錯誤訊息（searchError + compareError state）
- [x] 加入完整 Loading 狀態（搜尋中轉圈、查詢中進度）
- [x] 確認匯率 API 在部署伺服器可穩定取得資料（備用靜態匯率）

## Bug 修復（第六批）
- [x] 研究根本原因：Apple App Store 網頁無 JSON 數字欄位，字串解析是唯一可行方式
- [x] 修復換算爆表：detectCurrencyFromPrice 改以 country.currency 為主，不再用 $ 符號推斷 USD
  - 台灣 $3,290.00 → TWD（不再誤判為 USD × 32 = NT$105,280）
  - 阿根廷 $1,999 → ARS（不再誤判為 USD）
  - 緬甸 USD 4.99 → USD（字串明確寫了 USD，仍正確偵測）
- [x] 匯出 detectCurrencyFromPrice 和 parsePrice 供測試直接引用
- [x] 更新單元測試（43 個全部通過）：新增台灣/阿根廷 $ 符號保持原貨幣的測試案例
- [x] TypeScript 0 errors
