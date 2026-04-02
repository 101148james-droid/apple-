import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { searchApps, scrapeAllCountriesIAP, SUPPORTED_COUNTRIES } from "./appstore";
import { getExchangeRates, convertToTWD, formatTWD } from "./exchange";
import {
  addSearchHistory,
  getSearchHistory,
  deleteSearchHistory,
  clearSearchHistory,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== App Store 相關 API =====
  appstore: router({
    // 搜尋遊戲
    search: publicProcedure
      .input(z.object({ term: z.string().min(1).max(100) }))
      .query(async ({ input }) => {
        const results = await searchApps(input.term, "tw");
        return results;
      }),

    // 取得支援的國家列表
    countries: publicProcedure.query(() => {
      return SUPPORTED_COUNTRIES.map(c => ({
        code: c.code,
        name: c.name,
        currency: c.currency,
        symbol: c.symbol,
        flag: c.flag,
      }));
    }),

    // 查詢各國內購價格並換算成台幣
    compareIAP: publicProcedure
      .input(
        z.object({
          appId: z.string().min(1),
          appName: z.string().optional(),
          appIcon: z.string().optional(),
          developer: z.string().optional(),
          countries: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        // 並行：爬取各國 IAP + 取得匯率
        const [countryResults, exchangeData] = await Promise.all([
          scrapeAllCountriesIAP(input.appId, input.countries),
          getExchangeRates(),
        ]);

        const rates = exchangeData.rates;

        // 整合結果：為每個國家的每個 IAP 項目加上台幣換算
        const enriched = countryResults.map((country) => ({
          ...country,
          items: country.items.map((item) => {
            const twdAmount = convertToTWD(item.price, item.currency, rates);
            return {
              ...item,
              twdAmount: Math.round(twdAmount),
              twdFormatted: formatTWD(twdAmount),
            };
          }),
        }));

        // 儲存查詢歷史（若有 appName）
        if (input.appName) {
          await addSearchHistory({
            appId: input.appId,
            appName: input.appName,
            appIcon: input.appIcon,
            developer: input.developer,
          }).catch(() => {});
        }

        return {
          appId: input.appId,
          countries: enriched,
          exchangeSource: exchangeData.source,
          ratesUpdatedAt: exchangeData.updatedAt,
        };
      }),

    // 取得即時匯率
    exchangeRates: publicProcedure.query(async () => {
      const data = await getExchangeRates();
      return data;
    }),
  }),

  // ===== 歷史記錄 API =====
  history: router({
    list: publicProcedure.query(async () => {
      const rows = await getSearchHistory(undefined, undefined, 30);
      return rows;
    }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSearchHistory(input.id);
        return { success: true };
      }),

    clear: publicProcedure.mutation(async () => {
      await clearSearchHistory();
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
