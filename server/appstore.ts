import axios from "axios";
import * as cheerio from "cheerio";

// 支援的國家/地區列表
export const SUPPORTED_COUNTRIES = [
  { code: "tw", name: "台灣", currency: "TWD", symbol: "NT$", flag: "🇹🇼" },
  { code: "jp", name: "日本", currency: "JPY", symbol: "¥", flag: "🇯🇵" },
  { code: "us", name: "美國", currency: "USD", symbol: "$", flag: "🇺🇸" },
  { code: "hk", name: "香港", currency: "HKD", symbol: "HK$", flag: "🇭🇰" },
  { code: "kr", name: "韓國", currency: "KRW", symbol: "₩", flag: "🇰🇷" },
  { code: "cn", name: "中國", currency: "CNY", symbol: "¥", flag: "🇨🇳" },
  { code: "sg", name: "新加坡", currency: "SGD", symbol: "S$", flag: "🇸🇬" },
  { code: "gb", name: "英國", currency: "GBP", symbol: "£", flag: "🇬🇧" },
  { code: "au", name: "澳洲", currency: "AUD", symbol: "A$", flag: "🇦🇺" },
  { code: "th", name: "泰國", currency: "THB", symbol: "฿", flag: "🇹🇭" },
  { code: "tr", name: "土耳其", currency: "TRY", symbol: "₺", flag: "🇹🇷" },
  { code: "mx", name: "墨西哥", currency: "MXN", symbol: "MX$", flag: "🇲🇽" },
  { code: "br", name: "巴西", currency: "BRL", symbol: "R$", flag: "🇧🇷" },
  { code: "ru", name: "俄羅斯", currency: "RUB", symbol: "₽", flag: "🇷🇺" },
  { code: "sa", name: "沙烏地阿拉伯", currency: "SAR", symbol: "﷼", flag: "🇸🇦" },
] as const;

export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number]["code"];

export interface AppInfo {
  id: string;
  name: string;
  icon: string;
  developer: string;
  genre: string;
  url: string;
}

export interface IAPItem {
  name: string;
  price: number;
  currency: string;
  formattedPrice: string;
}

export interface CountryIAPResult {
  countryCode: string;
  countryName: string;
  currency: string;
  symbol: string;
  flag: string;
  items: IAPItem[];
  error?: string;
}

// 搜尋 App Store 遊戲
export async function searchApps(term: string, country = "tw"): Promise<AppInfo[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=software&limit=20&lang=zh_TW`;
  const response = await axios.get(url, {
    headers: { "User-Agent": "iTunes/12.0" },
    timeout: 10000,
  });
  const results = response.data?.results || [];
  return results.map((r: Record<string, unknown>) => ({
    id: String(r.trackId),
    name: String(r.trackName || ""),
    icon: String(r.artworkUrl100 || r.artworkUrl60 || ""),
    developer: String(r.artistName || ""),
    genre: String(r.primaryGenreName || ""),
    url: String(r.trackViewUrl || ""),
  }));
}

// 從 App Store 網頁爬取某國的內購項目
export async function scrapeCountryIAP(appId: string, countryCode: string): Promise<IAPItem[]> {
  const country = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode);
  if (!country) return [];

  const url = `https://apps.apple.com/${countryCode}/app/id${appId}`;
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        Accept: "text/html,application/xhtml+xml",
      },
      timeout: 15000,
      decompress: true,
    });

    const html = response.data as string;
    const $ = cheerio.load(html);

    const items: IAPItem[] = [];

    // 方法一：從 HTML 中的 text-pair 結構提取
    $(".text-pair").each((_, el) => {
      const spans = $(el).find("span");
      if (spans.length >= 2) {
        const name = $(spans[0]).text().trim();
        const priceText = $(spans[1]).text().trim();
        if (name && priceText && priceText !== name) {
          const parsed = parsePrice(priceText, country.currency);
          if (parsed !== null) {
            items.push({
              name,
              price: parsed,
              currency: country.currency,
              formattedPrice: priceText,
            });
          }
        }
      }
    });

    // 方法二：從 JSON 資料中提取（備用）
    if (items.length === 0) {
      const jsonMatch = html.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
      if (jsonMatch) {
        try {
          const jsonData = JSON.parse(jsonMatch[1]);
          extractIAPFromJson(jsonData, country.currency, items);
        } catch {
          // ignore parse errors
        }
      }
    }

    return items;
  } catch (err) {
    console.error(`[scrapeCountryIAP] Error for ${countryCode}/${appId}:`, err instanceof Error ? err.message : err);
    return [];
  }
}

function parsePrice(priceText: string, currency: string): number | null {
  // 移除貨幣符號、空格、千分位逗號，保留數字和小數點
  const cleaned = priceText
    .replace(/[^\d.,]/g, "")
    .replace(/,(?=\d{3}(?:[.,]|$))/g, "") // 移除千分位逗號
    .replace(/,/g, "."); // 某些地區用逗號作小數點

  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return null;

  // 日圓、韓元等無小數點貨幣
  if (["JPY", "KRW", "IDR", "VND"].includes(currency)) {
    return Math.round(num);
  }
  return num;
}

function extractIAPFromJson(data: unknown, currency: string, items: IAPItem[]): void {
  if (!data || typeof data !== "object") return;
  if (Array.isArray(data)) {
    data.forEach((item) => extractIAPFromJson(item, currency, items));
    return;
  }
  const obj = data as Record<string, unknown>;
  // 找 inAppPurchases 陣列
  if (obj.inAppPurchases && Array.isArray(obj.inAppPurchases)) {
    for (const iap of obj.inAppPurchases) {
      if (typeof iap === "object" && iap !== null) {
        const i = iap as Record<string, unknown>;
        const name = String(i.name || i.title || "");
        const priceText = String(i.price || i.formattedPrice || "");
        if (name && priceText) {
          const parsed = parsePrice(priceText, currency);
          if (parsed !== null) {
            items.push({ name, price: parsed, currency, formattedPrice: priceText });
          }
        }
      }
    }
  }
  // 遞迴搜尋
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") {
      extractIAPFromJson(val, currency, items);
    }
  }
}

// 並行爬取多國 IAP 資料
export async function scrapeAllCountriesIAP(appId: string, countryCodes?: string[]): Promise<CountryIAPResult[]> {
  const targets = countryCodes
    ? SUPPORTED_COUNTRIES.filter((c) => countryCodes.includes(c.code))
    : SUPPORTED_COUNTRIES;

  const results = await Promise.allSettled(
    targets.map(async (country) => {
      const items = await scrapeCountryIAP(appId, country.code);
      return {
        countryCode: country.code,
        countryName: country.name,
        currency: country.currency,
        symbol: country.symbol,
        flag: country.flag,
        items,
      } as CountryIAPResult;
    })
  );

  return results.map((result, idx) => {
    if (result.status === "fulfilled") return result.value;
    return {
      countryCode: targets[idx].code,
      countryName: targets[idx].name,
      currency: targets[idx].currency,
      symbol: targets[idx].symbol,
      flag: targets[idx].flag,
      items: [],
      error: result.reason instanceof Error ? result.reason.message : "查詢失敗",
    };
  });
}
