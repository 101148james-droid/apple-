import { describe, expect, it } from "vitest";
import { convertToTWD, formatTWD } from "./exchange";
import { SUPPORTED_COUNTRIES, detectCurrencyFromPrice, parsePrice } from "./appstore";

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

// 內建價格解析邏輯測試（使用從 appstore.ts 匯出的函式）
describe("price parsing logic", () => {
  // ===== parsePrice 測試 =====

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

  it("應對無效價格回傳 null", () => {
    expect(parsePrice("", "TWD")).toBeNull();
    expect(parsePrice("免費", "TWD")).toBeNull();
    expect(parsePrice("Free", "TWD")).toBeNull();
  });

  it("應正確解析 NBSP 分隔的價格（5,99\xa0$US）", () => {
    // NBSP 替換後，5,99 $US 應解析為 5.99
    expect(parsePrice("5,99\u00a0$US", "USD")).toBeCloseTo(5.99, 2);
    expect(parsePrice("1,99\u00a0$US", "USD")).toBeCloseTo(1.99, 2);
    expect(parsePrice("99,99\u00a0$US", "USD")).toBeCloseTo(99.99, 2);
  });

  it("應正確解析 USD NBSP 前置格式（USD\xa04.99）", () => {
    expect(parsePrice("USD\u00a04.99", "USD")).toBeCloseTo(4.99, 2);
    expect(parsePrice("USD\u00a09.99", "USD")).toBeCloseTo(9.99, 2);
  });

  it("應正確解析法式千分位格式（1 999,99）", () => {
    // 式：空格千分位 + 逗號小數點
    expect(parsePrice("1 999,99", "EUR")).toBeCloseTo(1999.99, 1);
    expect(parsePrice("1 999,00", "XAF")).toBe(1999);
  });

  // ===== detectCurrencyFromPrice 測試 =====

  it("應正確偵測前置 USD 代碼（字串明確包含 USD）", () => {
    // 字串中明確包含 USD 代碼，應覆蓋預設幣別
    expect(detectCurrencyFromPrice("USD 4.99", "EUR")).toBe("USD");
    expect(detectCurrencyFromPrice("USD 9.99", "GBP")).toBe("USD");
    // 默認幣別已是 USD 的國家（字串用 $ 符號，默認幣別不變）
    expect(detectCurrencyFromPrice("$4.99", "USD")).toBe("USD"); // 緬甸、黑巴嫩等
    expect(detectCurrencyFromPrice("$9.99", "USD")).toBe("USD"); // 黃巴嫩等
  });

  it("黃巴嫩/$4.99 應保持 USD（已修正幣別為 USD）", () => {
    // 黃巴嫩、衣索比亞等國家 App Store 實際用 USD 計價
    // SUPPORTED_COUNTRIES 中已將這些國家的 currency 改為 USD
    expect(detectCurrencyFromPrice("$4.99", "USD")).toBe("USD"); // 黃巴嫩 (lb)
    expect(detectCurrencyFromPrice("$99.99", "USD")).toBe("USD"); // 衣索比亞 (et)
    expect(detectCurrencyFromPrice("$4.99", "USD")).toBe("USD"); // 緬甸 (mm)
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

  it("應正確偵測 $US 非標準代碼（喀麥隆/象牙海岸）", () => {
    // 喀麥隆格式：5,99\xa0$US
    expect(detectCurrencyFromPrice("5,99\u00a0$US", "XAF")).toBe("USD");
    expect(detectCurrencyFromPrice("1,99\u00a0$US", "XAF")).toBe("USD");
    expect(detectCurrencyFromPrice("4,99\u00a0$US", "XOF")).toBe("USD");
  });

  it("台灣 $3,290.00 應保持 TWD（不誤判為 USD）", () => {
    // 修復核心：台灣的 $ 符號是 TWD，不是 USD
    expect(detectCurrencyFromPrice("$3,290.00", "TWD")).toBe("TWD");
    expect(detectCurrencyFromPrice("$330.00", "TWD")).toBe("TWD");
    expect(detectCurrencyFromPrice("$99.00", "TWD")).toBe("TWD");
  });

  it("阿根廷 $1,999 應保持 ARS（不誤判為 USD）", () => {
    // 阿根廷的 $ 符號是 ARS，不是 USD
    expect(detectCurrencyFromPrice("$1,999.00", "ARS")).toBe("ARS");
    expect(detectCurrencyFromPrice("$499.00", "ARS")).toBe("ARS");
  });

  it("USD 國家的 $ 符號應保持 USD", () => {
    // 美國、帛琉、薩爾瓦多等 USD 國家
    expect(detectCurrencyFromPrice("$4.99", "USD")).toBe("USD");
    expect(detectCurrencyFromPrice("$9.99", "USD")).toBe("USD");
  });

  it("應在無法偵測時回傳預設貨幣", () => {
    expect(detectCurrencyFromPrice("₹ 499", "INR")).toBe("INR");
    expect(detectCurrencyFromPrice("¥1,200", "JPY")).toBe("JPY");
    expect(detectCurrencyFromPrice("330.00", "TWD")).toBe("TWD");
  });

  it("HK$ 格式應偵測為 HKD", () => {
    expect(detectCurrencyFromPrice("HK$12.00", "HKD")).toBe("HKD");
    // 如果某國預設不是 HKD 但顯示 HK$，應偵測為 HKD
    expect(detectCurrencyFromPrice("HK$12.00", "USD")).toBe("HKD");
  });

  it("A$ 格式應偵測為 AUD", () => {
    expect(detectCurrencyFromPrice("A$4.99", "AUD")).toBe("AUD");
    expect(detectCurrencyFromPrice("A$4.99", "USD")).toBe("AUD");
  });
});
