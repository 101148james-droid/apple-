/**
 * compareStream.ts
 *
 * Bug 2 修復：實作 SSE（Server-Sent Events）串流比價 API
 *
 * 解決問題：
 * - 原本 compareIAP 需要等 130+ 國全部查完才回傳，前端等待 30-60 秒
 * - 長時間等待容易觸發前端 Timeout，畫面卡死
 * - 瀏覽器擴充功能（翻譯、廣告攔截）在 Hydration 時干擾 DOM
 *
 * 解法：
 * - 後端使用 SSE 逐國推送結果，查到一個國家就立即發送
 * - 前端收到每個國家的資料就立即渲染，不等全部完成
 * - 避免長時間空白等待，DOM 操作分散在多個 tick，減少翻譯外掛干擾
 */

import type { Express, Request, Response } from "express";
import pLimit from "p-limit";
import { SUPPORTED_COUNTRIES, scrapeCountryIAP } from "./appstore";
import { getExchangeRates, convertToTWD, formatTWD } from "./exchange";
import { addSearchHistory } from "./db";

// 每個 SSE 事件的資料格式
export interface StreamEvent {
  type: "country" | "done" | "error" | "progress";
  data?: {
    countryCode: string;
    countryName: string;
    currency: string;
    symbol: string;
    flag: string;
    region: string;
    /**
     * status 欄位：
     * - 'available'   : 有抓到內購資料
     * - 'unpublished' : 未上架（404 或無內購）
     * - 'error'       : 查詢失敗（網路錯誤等）
     */
    status: 'available' | 'unpublished' | 'error';
    items: Array<{
      name: string;
      price: number;
      currency: string;
      formattedPrice: string;
      twdAmount: number;
      twdFormatted: string;
    }>;
    error?: string;
  };
  progress?: {
    completed: number;
    total: number;
  };
  meta?: {
    exchangeSource: string;
    ratesUpdatedAt: number;
    appId: string;
  };
  message?: string;
}

// 嚴格限制同時請求數為 5
const CONCURRENCY_LIMIT = 5;

export function registerCompareStreamRoute(app: Express) {
  app.get("/api/compare-stream", async (req: Request, res: Response) => {
    const { appId, appName, appIcon, developer, countries: countriesParam } = req.query;

    if (!appId || typeof appId !== "string") {
      res.status(400).json({ error: "Missing appId" });
      return;
    }

    // 設定 SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // 關閉 Nginx 緩衝
    res.flushHeaders();

    // 輔助函式：發送 SSE 事件
    const sendEvent = (event: StreamEvent) => {
      if (res.writableEnded) return;
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    // 客戶端斷線時清理
    let isAborted = false;
    req.on("close", () => {
      isAborted = true;
    });

    try {
      // 取得匯率（先取得，避免每個國家都查一次）
      const exchangeData = await getExchangeRates();
      const rates = exchangeData.rates;

      // 決定要查哪些國家
      let targetCodes: string[] | undefined;
      if (countriesParam && typeof countriesParam === "string") {
        targetCodes = countriesParam.split(",").filter(Boolean);
      }

      const targets = targetCodes
        ? SUPPORTED_COUNTRIES.filter((c) => targetCodes!.includes(c.code))
        : [...SUPPORTED_COUNTRIES];

      const total = targets.length;
      let completed = 0;

      // 發送進度初始化
      sendEvent({
        type: "progress",
        progress: { completed: 0, total },
        meta: {
          exchangeSource: exchangeData.source,
          ratesUpdatedAt: exchangeData.updatedAt,
          appId,
        },
      });

      // 使用 p-limit 嚴格控制併發數
      const limit = pLimit(CONCURRENCY_LIMIT);

      // 批次大小：每批 10 個，批次間隨機延遲 500-1000ms
      const BATCH_SIZE = 10;

      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        if (isAborted) break;

        // 批次間隨機延遲（第一批不延遲）
        if (i > 0) {
          const delay = 500 + Math.random() * 500;
          await new Promise((r) => setTimeout(r, delay));
        }

        const batch = targets.slice(i, i + BATCH_SIZE);

        // 並行處理這批，但受 p-limit 全局限制
        await Promise.allSettled(
          batch.map((country) =>
            limit(async () => {
              if (isAborted) return;

              try {
                const result = await scrapeCountryIAP(appId, country.code);
                completed++;

                // 計算 status
                const status: 'available' | 'unpublished' | 'error' =
                  result.errorMsg ? 'error' :
                  result.unpublished ? 'unpublished' :
                  result.items.length > 0 ? 'available' : 'unpublished';

                // 立即推送這個國家的結果（包含 status，未上架也推送）
                sendEvent({
                  type: "country",
                  data: {
                    countryCode: country.code,
                    countryName: country.name,
                    currency: country.currency,
                    symbol: country.symbol,
                    flag: country.flag,
                    region: country.region,
                    status,
                    items: result.items.map((item) => {
                      const twdAmount = convertToTWD(item.price, item.currency, rates);
                      return {
                        ...item,
                        twdAmount: Math.round(twdAmount),
                        twdFormatted: formatTWD(twdAmount),
                      };
                    }),
                    error: result.errorMsg,
                  },
                  progress: { completed, total },
                });
              } catch (err) {
                completed++;
                sendEvent({
                  type: "country",
                  data: {
                    countryCode: country.code,
                    countryName: country.name,
                    currency: country.currency,
                    symbol: country.symbol,
                    flag: country.flag,
                    region: country.region,
                    status: 'error',
                    items: [],
                    error: err instanceof Error ? err.message : "查詢失敗",
                  },
                  progress: { completed, total },
                });
              }
            })
          )
        );
      }

      // 儲存查詢歷史
      if (appName && typeof appName === "string") {
        await addSearchHistory({
          appId,
          appName,
          appIcon: typeof appIcon === "string" ? appIcon : undefined,
          developer: typeof developer === "string" ? developer : undefined,
        }).catch(() => {});
      }

      // 發送完成事件
      sendEvent({
        type: "done",
        meta: {
          exchangeSource: exchangeData.source,
          ratesUpdatedAt: exchangeData.updatedAt,
          appId,
        },
      });
    } catch (err) {
      sendEvent({
        type: "error",
        message: err instanceof Error ? err.message : "查詢失敗",
      });
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  });
}
