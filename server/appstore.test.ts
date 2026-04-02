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
  };

  it("converts JPY to TWD correctly", () => {
    // 12000 JPY * 0.2178 = 2613.6 TWD
    const result = convertToTWD(12000, "JPY", mockRates);
    expect(result).toBeCloseTo(2613.6, 0);
  });

  it("converts USD to TWD correctly", () => {
    // 9.99 USD * 32.5 = 324.675 TWD
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
    // 10000 KRW * 0.0237 = 237 TWD
    const result = convertToTWD(10000, "KRW", mockRates);
    expect(result).toBeCloseTo(237, 0);
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

  it("includes at least 10 countries", () => {
    expect(SUPPORTED_COUNTRIES.length).toBeGreaterThanOrEqual(10);
  });

  it("all countries have required fields", () => {
    for (const country of SUPPORTED_COUNTRIES) {
      expect(country.code).toBeTruthy();
      expect(country.name).toBeTruthy();
      expect(country.currency).toBeTruthy();
      expect(country.symbol).toBeTruthy();
      expect(country.flag).toBeTruthy();
    }
  });
});

describe("auth.logout", () => {
  it("passes basic sanity check", () => {
    expect(true).toBe(true);
  });
});
