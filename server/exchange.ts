import axios from "axios";

// 匯率快取（TTL 30 分鐘）
let ratesCache: { rates: Record<string, number>; updatedAt: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000;

// 備用靜態匯率（1 外幣 = X TWD，2025 年參考值）
const FALLBACK_RATES: Record<string, number> = {
  TWD: 1,
  // 亞太
  JPY: 0.218,    USD: 32.5,    HKD: 4.17,    CNY: 4.48,    KRW: 0.0237,
  SGD: 24.1,     AUD: 20.8,    NZD: 19.2,    INR: 0.39,    THB: 0.94,
  IDR: 0.00205,  PHP: 0.57,    MYR: 7.3,     VND: 0.00131, PKR: 0.116,
  BDT: 0.295,    LKR: 0.109,   NPR: 0.244,   KHR: 0.00795, MMK: 0.0155,
  MNT: 0.00955,  FJD: 14.5,    PGK: 8.7,     BTN: 0.39,    MVR: 2.11,
  LAK: 0.00155,  WST: 11.8,    VUV: 0.272,   SBD: 3.85,    TOP: 13.8,
  // 歐洲
  GBP: 41.5,     EUR: 35.2,    CHF: 36.8,    SEK: 3.05,    NOK: 3.0,
  DKK: 4.72,     PLN: 8.15,    CZK: 1.43,    HUF: 0.089,   RON: 7.08,
  BGN: 18.0,     RUB: 0.355,   TRY: 0.94,    UAH: 0.785,   ALL: 0.345,
  AMD: 0.0835,   AZN: 19.1,    GEL: 11.8,    KZT: 0.067,   KGS: 0.375,
  MDL: 1.83,     MKD: 0.571,   BAM: 18.0,    RSD: 0.301,   ISK: 0.237,
  TMT: 9.3,      TJS: 2.97,    UZS: 0.00255,
  // 美洲
  CAD: 23.8,     MXN: 1.63,    BRL: 5.68,    ARS: 0.0325,  CLP: 0.0345,
  COP: 0.00785,  PEN: 8.65,    VES: 0.00089, BOB: 4.72,    PYG: 0.00435,
  UYU: 0.815,    GTQ: 4.22,    CRC: 0.063,   HNL: 1.31,    NIO: 0.895,
  DOP: 0.554,    JMD: 0.21,    TTD: 4.8,     BBD: 16.25,   BSD: 32.5,
  BZD: 16.1,     GYD: 0.155,   SRD: 0.895,
  // 中東
  SAR: 8.67,     AED: 8.85,    ILS: 8.9,     EGP: 0.665,   JOD: 45.8,
  KWD: 105.5,    BHD: 86.2,    QAR: 8.93,    OMR: 84.5,    LBP: 0.00036,
  IQD: 0.0248,   IRR: 0.000078, YER: 0.13,
  // 非洲
  ZAR: 1.78,     NGN: 0.0215,  KES: 0.252,   GHS: 2.15,    TZS: 0.0127,
  UGX: 0.00875,  ETB: 0.285,   XAF: 0.0537,  XOF: 0.0537,  MAD: 3.25,
  DZD: 0.242,    TND: 10.4,    AOA: 0.0355,  MZN: 0.508,   ZMW: 1.28,
  BWP: 2.37,     NAD: 1.78,    MUR: 0.715,   RWF: 0.0285,  MGA: 0.0072,
  CVE: 0.32,     GMD: 0.455,   SLL: 0.00155, LRD: 0.168,
};

export interface ExchangeRates {
  rates: Record<string, number>;
  updatedAt: number;
  source: "api" | "fallback";
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  if (ratesCache && now - ratesCache.updatedAt < CACHE_TTL) {
    return { ...ratesCache, source: "api" };
  }

  try {
    const response = await axios.get("https://open.er-api.com/v6/latest/TWD", {
      timeout: 8000,
    });
    if (response.data?.result === "success" && response.data?.rates) {
      const rawRates = response.data.rates as Record<string, number>;
      const rates: Record<string, number> = { TWD: 1 };
      for (const [currency, rate] of Object.entries(rawRates)) {
        if (rate > 0) rates[currency] = 1 / rate;
      }
      ratesCache = { rates, updatedAt: now };
      return { rates, updatedAt: now, source: "api" };
    }
  } catch (err) {
    console.warn("[ExchangeRates] API failed, using fallback:", err instanceof Error ? err.message : err);
  }

  return { rates: FALLBACK_RATES, updatedAt: now, source: "fallback" };
}

export function convertToTWD(amount: number, currency: string, rates: Record<string, number>): number {
  if (currency === "TWD") return amount;
  const rate = rates[currency];
  if (!rate) return 0;
  return amount * rate;
}

export function formatTWD(amount: number): string {
  if (amount <= 0) return "N/A";
  return `NT$${Math.round(amount).toLocaleString("zh-TW")}`;
}
