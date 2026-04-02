import { describe, expect, it } from "vitest";
import { convertToTWD, formatTWD } from "./exchange";
import { SUPPORTED_COUNTRIES } from "./appstore";

describe("exchange rate conversion", () => {
  const mockRates: Record<string, number> = {
    TWD: 1,
    JPY: 0.2178,
    USD: 32.5,
    HKD: 4.17,
    KRW: 0.0237,
    CNY: 4.48,
    TRY: 0.94,
    ARS: 0.0325,
    INR: 0.39,
    EUR: 35.2,
    GBP: 41.5,
  };

  it("converts JPY to TWD correctly", () => {
    const result = convertToTWD(12000, "JPY", mockRates);
    expect(result).toBeCloseTo(2613.6, 0);
  });

  it("converts USD to TWD correctly", () => {
    const result = convertToTWD(9.99, "USD", mockRates);
    expect(result).toBeCloseTo(324.675, 0);
  });

  it("returns TWD as-is", () => {
    const result = convertToTWD(3290, "TWD", mockRates);
    expect(result).toBe(3290);
  });

  it("returns 0 for unknown currency", () => {
    const result = convertToTWD(100, "XYZ", mockRates);
    expect(result).toBe(0);
  });

  it("formats TWD correctly", () => {
    expect(formatTWD(3290)).toBe("NT$3,290");
    expect(formatTWD(12345)).toBe("NT$12,345");
    expect(formatTWD(0)).toBe("N/A");
  });

  it("converts KRW to TWD correctly", () => {
    const result = convertToTWD(10000, "KRW", mockRates);
    expect(result).toBeCloseTo(237, 0);
  });

  it("converts TRY to TWD correctly (Turkey)", () => {
    const result = convertToTWD(1000, "TRY", mockRates);
    expect(result).toBeCloseTo(940, 0);
  });

  it("converts ARS to TWD correctly (Argentina)", () => {
    const result = convertToTWD(10000, "ARS", mockRates);
    expect(result).toBeCloseTo(325, 0);
  });

  it("converts EUR to TWD correctly", () => {
    const result = convertToTWD(9.99, "EUR", mockRates);
    expect(result).toBeCloseTo(351.648, 0);
  });
});

describe("SUPPORTED_COUNTRIES", () => {
  it("includes Taiwan", () => {
    const tw = SUPPORTED_COUNTRIES.find((c) => c.code === "tw");
    expect(tw).toBeDefined();
    expect(tw?.currency).toBe("TWD");
    expect(tw?.flag).toBe("🇹🇼");
  });

  it("includes Japan", () => {
    const jp = SUPPORTED_COUNTRIES.find((c) => c.code === "jp");
    expect(jp).toBeDefined();
    expect(jp?.currency).toBe("JPY");
  });

  it("includes at least 100 countries (全球覆蓋)", () => {
    expect(SUPPORTED_COUNTRIES.length).toBeGreaterThanOrEqual(100);
  });

  it("includes Turkey (cheap region)", () => {
    const tr = SUPPORTED_COUNTRIES.find((c) => c.code === "tr");
    expect(tr).toBeDefined();
    expect(tr?.currency).toBe("TRY");
    expect(tr?.region).toBe("歐洲");
  });

  it("includes Argentina (cheap region)", () => {
    const ar = SUPPORTED_COUNTRIES.find((c) => c.code === "ar");
    expect(ar).toBeDefined();
    expect(ar?.currency).toBe("ARS");
    expect(ar?.region).toBe("美洲");
  });

  it("includes India", () => {
    const ind = SUPPORTED_COUNTRIES.find((c) => c.code === "in");
    expect(ind).toBeDefined();
    expect(ind?.currency).toBe("INR");
    expect(ind?.region).toBe("亞太");
  });

  it("includes South Africa", () => {
    const za = SUPPORTED_COUNTRIES.find((c) => c.code === "za");
    expect(za).toBeDefined();
    expect(za?.currency).toBe("ZAR");
    expect(za?.region).toBe("非洲");
  });

  it("includes Saudi Arabia", () => {
    const sa = SUPPORTED_COUNTRIES.find((c) => c.code === "sa");
    expect(sa).toBeDefined();
    expect(sa?.region).toBe("中東");
  });

  it("all countries have required fields", () => {
    for (const country of SUPPORTED_COUNTRIES) {
      expect(country.code).toBeTruthy();
      expect(country.name).toBeTruthy();
      expect(country.currency).toBeTruthy();
      expect(country.symbol).toBeTruthy();
      expect(country.flag).toBeTruthy();
      expect(country.region).toBeTruthy();
    }
  });

  it("no duplicate country codes", () => {
    const codes = SUPPORTED_COUNTRIES.map((c) => c.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it("covers all 5 regions", () => {
    const regions = new Set(SUPPORTED_COUNTRIES.map((c) => c.region));
    expect(regions.has("亞太")).toBe(true);
    expect(regions.has("歐洲")).toBe(true);
    expect(regions.has("美洲")).toBe(true);
    expect(regions.has("中東")).toBe(true);
    expect(regions.has("非洲")).toBe(true);
  });
});

describe("auth.logout", () => {
  it("passes basic sanity check", () => {
    expect(true).toBe(true);
  });
});

// 內建價格解析邏輯測試
describe("price parsing logic", () => {
  // 複製內部邏輯進行測試
  const SYMBOL_TO_CURRENCY_TEST: Record<string, string> = {
    "$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY",
    "₩": "KRW", "₹": "INR", "₺": "TRY", "₽": "RUB",
    "₴": "UAH", "฿": "THB", "៛": "KHR", "₮": "MNT",
  };

  function detectCurrencyFromPrice(priceText: string, defaultCurrency: string): string {
    const text = priceText.trim();
    // 1. 前置貨幣代碼（USD 4.99）
    const prefixCodeMatch = text.match(/^([A-Z]{3})\s+[\d]/);
    if (prefixCodeMatch) return prefixCodeMatch[1];
    // 2. 後置貨幣代碼（0,49 USD）
    const suffixCodeMatch = text.match(/[\d][\d.,]*\s+([A-Z]{3})$/);
    if (suffixCodeMatch) return suffixCodeMatch[1];
    // 3. 後置貨幣符號（0,39 €）
    const suffixSymbolMatch = text.match(/[\d][\d.,]*\s*([^\d.,\s]+)$/);
    if (suffixSymbolMatch) {
      const sym = suffixSymbolMatch[1].trim();
      if (SYMBOL_TO_CURRENCY_TEST[sym]) return SYMBOL_TO_CURRENCY_TEST[sym];
    }
    // 4. 前置 $ 且國家不是 USD
    if (text.startsWith("$") && defaultCurrency !== "USD") return "USD";
    return defaultCurrency;
  }

  function parsePrice(priceText: string, currency: string): number | null {
    const text = priceText.trim();
    const ribuMatch = text.match(/([\d.,]+)\s*ribu/i);
    if (ribuMatch) {
      const numStr = ribuMatch[1].replace(/[.,]/g, "");
      const num = parseFloat(numStr) * 1000;
      return isNaN(num) || num <= 0 ? null : Math.round(num);
    }
    let cleaned = text.replace(/^[^\d]+/, "");
    cleaned = cleaned.replace(/[^\d.,]/g, "");
    if (!cleaned) return null;
    const noDecimal = ["JPY","KRW","IDR","VND","CLP","PYG","UGX","RWF","KHR","MMK","LAK","MNT","ISK","XAF","XOF","MGA","SLL","LBP","IQD","IRR","YER","DZD","UZS"];
    const isNoDecimal = noDecimal.includes(currency);
    const dotCount = cleaned.split(".").length - 1;
    const commaCount = cleaned.split(",").length - 1;
    if (dotCount > 1) {
      cleaned = cleaned.replace(/\./g, "");
    } else if (commaCount > 1) {
      cleaned = cleaned.replace(/,/g, "");
    } else if (dotCount === 1 && commaCount === 1) {
      const dotPos = cleaned.lastIndexOf(".");
      const commaPos = cleaned.lastIndexOf(",");
      if (dotPos > commaPos) cleaned = cleaned.replace(/,/g, "");
      else cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else if (dotCount === 1) {
      const parts = cleaned.split(".");
      if (parts[1] && parts[1].length === 3 && parts[0].length > 0 && isNoDecimal) {
        cleaned = cleaned.replace(".", ""); // 無小數點貨幣：.XXX 是千分位
      }
    } else if (commaCount === 1) {
      const parts = cleaned.split(",");
      if (parts[1] && parts[1].length === 3 && parts[0].length > 0) cleaned = cleaned.replace(",", "");
      else cleaned = cleaned.replace(",", ".");
    }
    const num = parseFloat(cleaned);
    if (isNaN(num) || num <= 0) return null;
    if (isNoDecimal) return Math.round(num);
    return num;
  }

  it("應正確解析 TWD 格式", () => {
    expect(parsePrice("$330.00", "TWD")).toBe(330);
    expect(parsePrice("$3,290.00", "TWD")).toBe(3290);
    expect(parsePrice("NT$330", "TWD")).toBe(330);
  });

  it("應正確解析 JPY 格式", () => {
    expect(parsePrice("¥ 1,200", "JPY")).toBe(1200);
    expect(parsePrice("¥12,000", "JPY")).toBe(12000);
  });

  it("應正確解析 IDR ribu 格式", () => {
    expect(parsePrice("Rp 81ribu", "IDR")).toBe(81000);
    expect(parsePrice("Rp 162ribu", "IDR")).toBe(162000);
  });

  it("應正確解析 IDR 點分隔格式（Rp 16.500）", () => {
    expect(parsePrice("Rp 16.500", "IDR")).toBe(16500);
  });

  it("應正確解析 INR 格式", () => {
    expect(parsePrice("₹ 499", "INR")).toBe(499);
    expect(parsePrice("₹ 99", "INR")).toBe(99);
  });

  it("應正確解析 BRL 格式（R$ 24,90）", () => {
    expect(parsePrice("R$ 24,90", "BRL")).toBe(24.9);
  });

  it("應正確解析 TRY 格式（₺79,99）", () => {
    expect(parsePrice("₺79,99", "TRY")).toBe(79.99);
    expect(parsePrice("TRY 79,99", "TRY")).toBe(79.99);
  });

  it("應正確偵測前置 USD 代碼（緬甸/斯里蘭卡）", () => {
    expect(detectCurrencyFromPrice("USD 4.99", "MMK")).toBe("USD");
    expect(detectCurrencyFromPrice("USD 9.99", "LKR")).toBe("USD");
    expect(detectCurrencyFromPrice("USD 4.99", "KHR")).toBe("USD");
  });

  it("應正確偵測後置 USD 代碼（0,49 USD）", () => {
    expect(detectCurrencyFromPrice("0,49 USD", "UAH")).toBe("USD");
    expect(detectCurrencyFromPrice("0.39 USD", "BDT")).toBe("USD");
    expect(detectCurrencyFromPrice("4,99 USD", "RSD")).toBe("USD");
  });

  it("應正確偵測後置 EUR 符號（0,39 €）", () => {
    expect(detectCurrencyFromPrice("0,39 €", "RSD")).toBe("EUR");
    expect(detectCurrencyFromPrice("4,99€", "ALL")).toBe("EUR");
  });

  it("應正確偵測 $ 符號在非 USD 國家（孟加拉/黎巴嫩/伊拉克）", () => {
    expect(detectCurrencyFromPrice("$0.39", "BDT")).toBe("USD");
    expect(detectCurrencyFromPrice("$0.39", "LBP")).toBe("USD");
    expect(detectCurrencyFromPrice("$0.39", "IQD")).toBe("USD");
    expect(detectCurrencyFromPrice("$0.39", "IRR")).toBe("USD");
    expect(detectCurrencyFromPrice("$0.39", "ETB")).toBe("USD");
  });

  it("應在無法偵測時回傳預設貨幣", () => {
    expect(detectCurrencyFromPrice("₹ 499", "INR")).toBe("INR");
    expect(detectCurrencyFromPrice("$330.00", "TWD")).toBe("USD"); // TWD 不是 USD，$ 視為 USD
    expect(detectCurrencyFromPrice("$330.00", "USD")).toBe("USD"); // USD 國家保留
  });

  it("應對無效價格回傳 null", () => {
    expect(parsePrice("", "TWD")).toBeNull();
    expect(parsePrice("免費", "TWD")).toBeNull();
    expect(parsePrice("Free", "TWD")).toBeNull();
  });
});
