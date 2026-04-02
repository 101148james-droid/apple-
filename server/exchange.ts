import axios from "axios";

// 匯率快取（TTL 30 分鐘）
let ratesCache: { rates: Record<string, number>; updatedAt: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// 備用靜態匯率（當 API 無法使用時）
const FALLBACK_RATES: Record<string, number> = {
  TWD: 1,
  JPY: 0.2178,   // 1 JPY ≈ 0.2178 TWD
  USD: 32.5,     // 1 USD ≈ 32.5 TWD
  HKD: 4.17,     // 1 HKD ≈ 4.17 TWD
  KRW: 0.0237,   // 1 KRW ≈ 0.0237 TWD
  CNY: 4.48,     // 1 CNY ≈ 4.48 TWD
  SGD: 24.1,     // 1 SGD ≈ 24.1 TWD
  GBP: 41.5,     // 1 GBP ≈ 41.5 TWD
  AUD: 20.8,     // 1 AUD ≈ 20.8 TWD
  THB: 0.94,     // 1 THB ≈ 0.94 TWD
  TRY: 0.94,     // 1 TRY ≈ 0.94 TWD
  MXN: 1.63,     // 1 MXN ≈ 1.63 TWD
  BRL: 5.68,     // 1 BRL ≈ 5.68 TWD
  RUB: 0.35,     // 1 RUB ≈ 0.35 TWD
  SAR: 8.67,     // 1 SAR ≈ 8.67 TWD
};

export interface ExchangeRates {
  rates: Record<string, number>; // currency -> TWD rate
  updatedAt: number;
  source: "api" | "fallback";
}

// 取得匯率（以 TWD 為基準）
export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();

  // 使用快取
  if (ratesCache && now - ratesCache.updatedAt < CACHE_TTL) {
    return { ...ratesCache, source: "api" };
  }

  try {
    // 使用 exchangerate-api.com 免費方案（以 TWD 為基準）
    const response = await axios.get("https://open.er-api.com/v6/latest/TWD", {
      timeout: 8000,
    });

    if (response.data?.result === "success" && response.data?.rates) {
      const rawRates = response.data.rates as Record<string, number>;
      // rawRates 是 1 TWD = X 外幣，我們需要反轉為 1 外幣 = X TWD
      const rates: Record<string, number> = { TWD: 1 };
      for (const [currency, rate] of Object.entries(rawRates)) {
        if (rate > 0) {
          rates[currency] = 1 / rate;
        }
      }
      ratesCache = { rates, updatedAt: now };
      return { rates, updatedAt: now, source: "api" };
    }
  } catch (err) {
    console.warn("[ExchangeRates] API failed, using fallback rates:", err instanceof Error ? err.message : err);
  }

  // 使用備用匯率
  return { rates: FALLBACK_RATES, updatedAt: now, source: "fallback" };
}

// 將某貨幣金額換算成 TWD
export function convertToTWD(amount: number, currency: string, rates: Record<string, number>): number {
  if (currency === "TWD") return amount;
  const rate = rates[currency];
  if (!rate) return 0;
  return amount * rate;
}

// 格式化台幣金額
export function formatTWD(amount: number): string {
  if (amount <= 0) return "N/A";
  return `NT$${Math.round(amount).toLocaleString("zh-TW")}`;
}
