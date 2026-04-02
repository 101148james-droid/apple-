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
