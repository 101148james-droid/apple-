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

## Bug 修復（第七批）
- [x] 研究 Apple App Store 網頁結構：確認無 tier/productId/currency 欄位，只有格式化字串
- [x] 修正幣別根本問題：在 SUPPORTED_COUNTRIES 中直接修正實際計價幣別
  - 黃巴嫩 (lb): LBP → USD（$4.99 → NT$162，不再是 NT$0）
  - 衣索比亞 (et): ETB → USD（$99.99 → NT$3,249，不再是 NT$20）
  - 緬甸 (mm): MMK → USD
  - 柬埔寨 (kh): KHR → USD
  - 孟加拉 (bd): BDT → USD
  - 斯里蘭卡 (lk): LKR → USD
  - 尼泊爾 (np): NPR → USD
  - 不丹 (bt): BTN → USD
  - 寢國 (la): LAK → USD
  - 伊拉克 (iq): IQD → USD
  - 伊朗 (ir): IRR → USD
  - 葉門 (ye): YER → USD
  - 馬達加斯加 (mg): MGA → USD
  - 維德角 (cv): CVE → USD
  - 辛巴威 (zw): ZWL → USD
  - 蘇利南 (sr): SRD → USD
- [x] 重構前端分組邏輯：
  - extractNumericKey 改為只提取 3 位以上數字（避免 Bundle12/Bundle22 誤合併）
  - buildComparisonTable 改用優先級系統（tw=0, hk=1, 其他中文=2, 英文=3）
  - 台灣有上架時強制顯示台灣中文名稱
- [x] 強化 API 錯誤防護：axios validateStatus 防止非 2xx 拋出異常
- [x] 44 個單元測試全部通過，TypeScript 0 errors

## Bug 修復（第八批）
- [x] 修復 503 Service Unavailable 導致 JSON 解析崩潰：在 tRPC fetch 包裝中加入 response.ok 檢查
  - 當伺服器回傳非 JSON 回應（如 503 HTML），直接拋出友善錯誤，避免 tRPC 嘗試 JSON.parse 而崩潰
- [x] 改善前端錯誤訊息：SyntaxError/503/502 顯示「伺服器暫時不可用，請稍候 30 秒後再試」
- [x] 移除 debug log（scrapeCountryIAP 的 OK/EMPTY 記錄）
- [x] 44 個測試全部通過，TypeScript 0 errors

## Bug 修復（第九批）
- [x] 修復幣別判斷：把阿爾及利亞(dz)、摩洛哥(ma)、突尼西亞(tn)、薩摩亞(ws) 的 currency 改為 USD
  - $19.99 在阿爾及利亞 → NT$650（不再是 NT$5）
- [x] 升級後端爬蟲 Headers：Windows Chrome 124 User-Agent + 完整瀏覽器 Headers
- [x] 45 個測試全部通過，TypeScript 0 errors

## Bug 修復（第十批）
- [x] 顯示真實錯誤訊息：移除包裝邏輯，直接顯示 HTTP 狀態碼 + body 內容 + console.error
- [x] 確認後端架構：所有請求都走後端 tRPC，不走前端直接 fetch
- [x] 加入 cors 套件，後端 Express 設定 CORS headers（origin: true, credentials: true）
- [x] 45 個測試全部通過，TypeScript 0 errors
