import axios from "axios";
import * as cheerio from "cheerio";

// 所有 App Store 支援的國家/地區（175 個）
export const SUPPORTED_COUNTRIES = [
  // 亞太地區
  { code: "tw", name: "台灣", currency: "TWD", symbol: "NT$", flag: "🇹🇼", region: "亞太" },
  { code: "jp", name: "日本", currency: "JPY", symbol: "¥", flag: "🇯🇵", region: "亞太" },
  { code: "hk", name: "香港", currency: "HKD", symbol: "HK$", flag: "🇭🇰", region: "亞太" },
  { code: "cn", name: "中國", currency: "CNY", symbol: "¥", flag: "🇨🇳", region: "亞太" },
  { code: "kr", name: "韓國", currency: "KRW", symbol: "₩", flag: "🇰🇷", region: "亞太" },
  { code: "sg", name: "新加坡", currency: "SGD", symbol: "S$", flag: "🇸🇬", region: "亞太" },
  { code: "au", name: "澳洲", currency: "AUD", symbol: "A$", flag: "🇦🇺", region: "亞太" },
  { code: "nz", name: "紐西蘭", currency: "NZD", symbol: "NZ$", flag: "🇳🇿", region: "亞太" },
  { code: "in", name: "印度", currency: "INR", symbol: "₹", flag: "🇮🇳", region: "亞太" },
  { code: "th", name: "泰國", currency: "THB", symbol: "฿", flag: "🇹🇭", region: "亞太" },
  { code: "id", name: "印尼", currency: "IDR", symbol: "Rp", flag: "🇮🇩", region: "亞太" },
  { code: "ph", name: "菲律賓", currency: "PHP", symbol: "₱", flag: "🇵🇭", region: "亞太" },
  { code: "my", name: "馬來西亞", currency: "MYR", symbol: "RM", flag: "🇲🇾", region: "亞太" },
  { code: "vn", name: "越南", currency: "VND", symbol: "₫", flag: "🇻🇳", region: "亞太" },
  { code: "pk", name: "巴基斯坦", currency: "PKR", symbol: "₨", flag: "🇵🇰", region: "亞太" },
  { code: "bd", name: "孟加拉", currency: "BDT", symbol: "৳", flag: "🇧🇩", region: "亞太" },
  { code: "lk", name: "斯里蘭卡", currency: "LKR", symbol: "Rs", flag: "🇱🇰", region: "亞太" },
  { code: "np", name: "尼泊爾", currency: "NPR", symbol: "Rs", flag: "🇳🇵", region: "亞太" },
  { code: "kh", name: "柬埔寨", currency: "KHR", symbol: "៛", flag: "🇰🇭", region: "亞太" },
  { code: "mm", name: "緬甸", currency: "MMK", symbol: "K", flag: "🇲🇲", region: "亞太" },
  { code: "mn", name: "蒙古", currency: "MNT", symbol: "₮", flag: "🇲🇳", region: "亞太" },
  { code: "fj", name: "斐濟", currency: "FJD", symbol: "FJ$", flag: "🇫🇯", region: "亞太" },
  { code: "pg", name: "巴布亞紐幾內亞", currency: "PGK", symbol: "K", flag: "🇵🇬", region: "亞太" },
  { code: "bt", name: "不丹", currency: "BTN", symbol: "Nu", flag: "🇧🇹", region: "亞太" },
  { code: "mv", name: "馬爾地夫", currency: "MVR", symbol: "Rf", flag: "🇲🇻", region: "亞太" },
  { code: "la", name: "寮國", currency: "LAK", symbol: "₭", flag: "🇱🇦", region: "亞太" },
  { code: "pw", name: "帛琉", currency: "USD", symbol: "$", flag: "🇵🇼", region: "亞太" },
  { code: "fm", name: "密克羅尼西亞", currency: "USD", symbol: "$", flag: "🇫🇲", region: "亞太" },
  { code: "ws", name: "薩摩亞", currency: "WST", symbol: "T", flag: "🇼🇸", region: "亞太" },
  { code: "vu", name: "萬那杜", currency: "VUV", symbol: "Vt", flag: "🇻🇺", region: "亞太" },
  { code: "sb", name: "所羅門群島", currency: "SBD", symbol: "SI$", flag: "🇸🇧", region: "亞太" },
  { code: "to", name: "東加", currency: "TOP", symbol: "T$", flag: "🇹🇴", region: "亞太" },
  // 歐洲
  { code: "gb", name: "英國", currency: "GBP", symbol: "£", flag: "🇬🇧", region: "歐洲" },
  { code: "de", name: "德國", currency: "EUR", symbol: "€", flag: "🇩🇪", region: "歐洲" },
  { code: "fr", name: "法國", currency: "EUR", symbol: "€", flag: "🇫🇷", region: "歐洲" },
  { code: "it", name: "義大利", currency: "EUR", symbol: "€", flag: "🇮🇹", region: "歐洲" },
  { code: "es", name: "西班牙", currency: "EUR", symbol: "€", flag: "🇪🇸", region: "歐洲" },
  { code: "nl", name: "荷蘭", currency: "EUR", symbol: "€", flag: "🇳🇱", region: "歐洲" },
  { code: "be", name: "比利時", currency: "EUR", symbol: "€", flag: "🇧🇪", region: "歐洲" },
  { code: "at", name: "奧地利", currency: "EUR", symbol: "€", flag: "🇦🇹", region: "歐洲" },
  { code: "ch", name: "瑞士", currency: "CHF", symbol: "CHF", flag: "🇨🇭", region: "歐洲" },
  { code: "se", name: "瑞典", currency: "SEK", symbol: "kr", flag: "🇸🇪", region: "歐洲" },
  { code: "no", name: "挪威", currency: "NOK", symbol: "kr", flag: "🇳🇴", region: "歐洲" },
  { code: "dk", name: "丹麥", currency: "DKK", symbol: "kr", flag: "🇩🇰", region: "歐洲" },
  { code: "fi", name: "芬蘭", currency: "EUR", symbol: "€", flag: "🇫🇮", region: "歐洲" },
  { code: "pt", name: "葡萄牙", currency: "EUR", symbol: "€", flag: "🇵🇹", region: "歐洲" },
  { code: "ie", name: "愛爾蘭", currency: "EUR", symbol: "€", flag: "🇮🇪", region: "歐洲" },
  { code: "pl", name: "波蘭", currency: "PLN", symbol: "zł", flag: "🇵🇱", region: "歐洲" },
  { code: "cz", name: "捷克", currency: "CZK", symbol: "Kč", flag: "🇨🇿", region: "歐洲" },
  { code: "hu", name: "匈牙利", currency: "HUF", symbol: "Ft", flag: "🇭🇺", region: "歐洲" },
  { code: "ro", name: "羅馬尼亞", currency: "RON", symbol: "lei", flag: "🇷🇴", region: "歐洲" },
  { code: "bg", name: "保加利亞", currency: "BGN", symbol: "лв", flag: "🇧🇬", region: "歐洲" },
  { code: "hr", name: "克羅埃西亞", currency: "EUR", symbol: "€", flag: "🇭🇷", region: "歐洲" },
  { code: "sk", name: "斯洛伐克", currency: "EUR", symbol: "€", flag: "🇸🇰", region: "歐洲" },
  { code: "si", name: "斯洛維尼亞", currency: "EUR", symbol: "€", flag: "🇸🇮", region: "歐洲" },
  { code: "lt", name: "立陶宛", currency: "EUR", symbol: "€", flag: "🇱🇹", region: "歐洲" },
  { code: "lv", name: "拉脫維亞", currency: "EUR", symbol: "€", flag: "🇱🇻", region: "歐洲" },
  { code: "ee", name: "愛沙尼亞", currency: "EUR", symbol: "€", flag: "🇪🇪", region: "歐洲" },
  { code: "gr", name: "希臘", currency: "EUR", symbol: "€", flag: "🇬🇷", region: "歐洲" },
  { code: "cy", name: "賽普勒斯", currency: "EUR", symbol: "€", flag: "🇨🇾", region: "歐洲" },
  { code: "mt", name: "馬爾他", currency: "EUR", symbol: "€", flag: "🇲🇹", region: "歐洲" },
  { code: "lu", name: "盧森堡", currency: "EUR", symbol: "€", flag: "🇱🇺", region: "歐洲" },
  { code: "ru", name: "俄羅斯", currency: "RUB", symbol: "₽", flag: "🇷🇺", region: "歐洲" },
  { code: "tr", name: "土耳其", currency: "TRY", symbol: "₺", flag: "🇹🇷", region: "歐洲" },
  { code: "ua", name: "烏克蘭", currency: "UAH", symbol: "₴", flag: "🇺🇦", region: "歐洲" },
  { code: "al", name: "阿爾巴尼亞", currency: "ALL", symbol: "L", flag: "🇦🇱", region: "歐洲" },
  { code: "am", name: "亞美尼亞", currency: "AMD", symbol: "֏", flag: "🇦🇲", region: "歐洲" },
  { code: "az", name: "亞塞拜然", currency: "AZN", symbol: "₼", flag: "🇦🇿", region: "歐洲" },
  { code: "ge", name: "喬治亞", currency: "GEL", symbol: "₾", flag: "🇬🇪", region: "歐洲" },
  { code: "kz", name: "哈薩克", currency: "KZT", symbol: "₸", flag: "🇰🇿", region: "歐洲" },
  { code: "kg", name: "吉爾吉斯", currency: "KGS", symbol: "с", flag: "🇰🇬", region: "歐洲" },
  { code: "md", name: "摩爾多瓦", currency: "MDL", symbol: "L", flag: "🇲🇩", region: "歐洲" },
  { code: "mk", name: "北馬其頓", currency: "MKD", symbol: "ден", flag: "🇲🇰", region: "歐洲" },
  { code: "ba", name: "波士尼亞", currency: "BAM", symbol: "KM", flag: "🇧🇦", region: "歐洲" },
  { code: "rs", name: "塞爾維亞", currency: "RSD", symbol: "din", flag: "🇷🇸", region: "歐洲" },
  { code: "me", name: "蒙特內哥羅", currency: "EUR", symbol: "€", flag: "🇲🇪", region: "歐洲" },
  { code: "is", name: "冰島", currency: "ISK", symbol: "kr", flag: "🇮🇸", region: "歐洲" },
  { code: "tm", name: "土庫曼", currency: "TMT", symbol: "T", flag: "🇹🇲", region: "歐洲" },
  { code: "tj", name: "塔吉克", currency: "TJS", symbol: "SM", flag: "🇹🇯", region: "歐洲" },
  { code: "uz", name: "烏茲別克", currency: "UZS", symbol: "so'm", flag: "🇺🇿", region: "歐洲" },
  // 美洲
  { code: "us", name: "美國", currency: "USD", symbol: "$", flag: "🇺🇸", region: "美洲" },
  { code: "ca", name: "加拿大", currency: "CAD", symbol: "CA$", flag: "🇨🇦", region: "美洲" },
  { code: "mx", name: "墨西哥", currency: "MXN", symbol: "MX$", flag: "🇲🇽", region: "美洲" },
  { code: "br", name: "巴西", currency: "BRL", symbol: "R$", flag: "🇧🇷", region: "美洲" },
  { code: "ar", name: "阿根廷", currency: "ARS", symbol: "$", flag: "🇦🇷", region: "美洲" },
  { code: "cl", name: "智利", currency: "CLP", symbol: "CL$", flag: "🇨🇱", region: "美洲" },
  { code: "co", name: "哥倫比亞", currency: "COP", symbol: "COL$", flag: "🇨🇴", region: "美洲" },
  { code: "pe", name: "秘魯", currency: "PEN", symbol: "S/.", flag: "🇵🇪", region: "美洲" },
  { code: "ve", name: "委內瑞拉", currency: "VES", symbol: "Bs.", flag: "🇻🇪", region: "美洲" },
  { code: "ec", name: "厄瓜多", currency: "USD", symbol: "$", flag: "🇪🇨", region: "美洲" },
  { code: "bo", name: "玻利維亞", currency: "BOB", symbol: "Bs.", flag: "🇧🇴", region: "美洲" },
  { code: "py", name: "巴拉圭", currency: "PYG", symbol: "₲", flag: "🇵🇾", region: "美洲" },
  { code: "uy", name: "烏拉圭", currency: "UYU", symbol: "$U", flag: "🇺🇾", region: "美洲" },
  { code: "gt", name: "瓜地馬拉", currency: "GTQ", symbol: "Q", flag: "🇬🇹", region: "美洲" },
  { code: "cr", name: "哥斯大黎加", currency: "CRC", symbol: "₡", flag: "🇨🇷", region: "美洲" },
  { code: "hn", name: "宏都拉斯", currency: "HNL", symbol: "L", flag: "🇭🇳", region: "美洲" },
  { code: "sv", name: "薩爾瓦多", currency: "USD", symbol: "$", flag: "🇸🇻", region: "美洲" },
  { code: "ni", name: "尼加拉瓜", currency: "NIO", symbol: "C$", flag: "🇳🇮", region: "美洲" },
  { code: "pa", name: "巴拿馬", currency: "USD", symbol: "$", flag: "🇵🇦", region: "美洲" },
  { code: "do", name: "多明尼加", currency: "DOP", symbol: "RD$", flag: "🇩🇴", region: "美洲" },
  { code: "jm", name: "牙買加", currency: "JMD", symbol: "J$", flag: "🇯🇲", region: "美洲" },
  { code: "tt", name: "千里達及托巴哥", currency: "TTD", symbol: "TT$", flag: "🇹🇹", region: "美洲" },
  { code: "bb", name: "巴貝多", currency: "BBD", symbol: "Bds$", flag: "🇧🇧", region: "美洲" },
  { code: "bs", name: "巴哈馬", currency: "BSD", symbol: "B$", flag: "🇧🇸", region: "美洲" },
  { code: "bz", name: "貝里斯", currency: "BZD", symbol: "BZ$", flag: "🇧🇿", region: "美洲" },
  { code: "gy", name: "蓋亞那", currency: "GYD", symbol: "G$", flag: "🇬🇾", region: "美洲" },
  { code: "sr", name: "蘇利南", currency: "SRD", symbol: "$", flag: "🇸🇷", region: "美洲" },
  // 中東
  { code: "sa", name: "沙烏地阿拉伯", currency: "SAR", symbol: "﷼", flag: "🇸🇦", region: "中東" },
  { code: "ae", name: "阿聯酋", currency: "AED", symbol: "د.إ", flag: "🇦🇪", region: "中東" },
  { code: "il", name: "以色列", currency: "ILS", symbol: "₪", flag: "🇮🇱", region: "中東" },
  { code: "eg", name: "埃及", currency: "EGP", symbol: "E£", flag: "🇪🇬", region: "中東" },
  { code: "jo", name: "約旦", currency: "JOD", symbol: "JD", flag: "🇯🇴", region: "中東" },
  { code: "kw", name: "科威特", currency: "KWD", symbol: "KD", flag: "🇰🇼", region: "中東" },
  { code: "bh", name: "巴林", currency: "BHD", symbol: "BD", flag: "🇧🇭", region: "中東" },
  { code: "qa", name: "卡達", currency: "QAR", symbol: "QR", flag: "🇶🇦", region: "中東" },
  { code: "om", name: "阿曼", currency: "OMR", symbol: "OMR", flag: "🇴🇲", region: "中東" },
  { code: "lb", name: "黎巴嫩", currency: "LBP", symbol: "L£", flag: "🇱🇧", region: "中東" },
  { code: "iq", name: "伊拉克", currency: "IQD", symbol: "ع.د", flag: "🇮🇶", region: "中東" },
  { code: "ir", name: "伊朗", currency: "IRR", symbol: "﷼", flag: "🇮🇷", region: "中東" },
  { code: "ye", name: "葉門", currency: "YER", symbol: "﷼", flag: "🇾🇪", region: "中東" },
  // 非洲
  { code: "za", name: "南非", currency: "ZAR", symbol: "R", flag: "🇿🇦", region: "非洲" },
  { code: "ng", name: "奈及利亞", currency: "NGN", symbol: "₦", flag: "🇳🇬", region: "非洲" },
  { code: "ke", name: "肯亞", currency: "KES", symbol: "KSh", flag: "🇰🇪", region: "非洲" },
  { code: "gh", name: "迦納", currency: "GHS", symbol: "GH₵", flag: "🇬🇭", region: "非洲" },
  { code: "tz", name: "坦尚尼亞", currency: "TZS", symbol: "TSh", flag: "🇹🇿", region: "非洲" },
  { code: "ug", name: "烏干達", currency: "UGX", symbol: "USh", flag: "🇺🇬", region: "非洲" },
  { code: "et", name: "衣索比亞", currency: "ETB", symbol: "Br", flag: "🇪🇹", region: "非洲" },
  { code: "cm", name: "喀麥隆", currency: "XAF", symbol: "FCFA", flag: "🇨🇲", region: "非洲" },
  { code: "ci", name: "象牙海岸", currency: "XOF", symbol: "CFA", flag: "🇨🇮", region: "非洲" },
  { code: "sn", name: "塞內加爾", currency: "XOF", symbol: "CFA", flag: "🇸🇳", region: "非洲" },
  { code: "ma", name: "摩洛哥", currency: "MAD", symbol: "MAD", flag: "🇲🇦", region: "非洲" },
  { code: "dz", name: "阿爾及利亞", currency: "DZD", symbol: "دج", flag: "🇩🇿", region: "非洲" },
  { code: "tn", name: "突尼西亞", currency: "TND", symbol: "DT", flag: "🇹🇳", region: "非洲" },
  { code: "ao", name: "安哥拉", currency: "AOA", symbol: "Kz", flag: "🇦🇴", region: "非洲" },
  { code: "mz", name: "莫三比克", currency: "MZN", symbol: "MT", flag: "🇲🇿", region: "非洲" },
  { code: "zm", name: "尚比亞", currency: "ZMW", symbol: "ZK", flag: "🇿🇲", region: "非洲" },
  { code: "zw", name: "辛巴威", currency: "USD", symbol: "$", flag: "🇿🇼", region: "非洲" },
  { code: "bw", name: "波札那", currency: "BWP", symbol: "P", flag: "🇧🇼", region: "非洲" },
  { code: "na", name: "納米比亞", currency: "NAD", symbol: "N$", flag: "🇳🇦", region: "非洲" },
  { code: "mu", name: "模里西斯", currency: "MUR", symbol: "Rs", flag: "🇲🇺", region: "非洲" },
  { code: "rw", name: "盧安達", currency: "RWF", symbol: "RF", flag: "🇷🇼", region: "非洲" },
  { code: "mg", name: "馬達加斯加", currency: "MGA", symbol: "Ar", flag: "🇲🇬", region: "非洲" },
  { code: "cv", name: "維德角", currency: "CVE", symbol: "$", flag: "🇨🇻", region: "非洲" },
  { code: "gm", name: "甘比亞", currency: "GMD", symbol: "D", flag: "🇬🇲", region: "非洲" },
  { code: "sl", name: "獅子山", currency: "SLL", symbol: "Le", flag: "🇸🇱", region: "非洲" },
  { code: "lr", name: "賴比瑞亞", currency: "LRD", symbol: "L$", flag: "🇱🇷", region: "非洲" },
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
  region: string;
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

    // 方法一：從 HTML 中的 text-pair 結構提取（支援 svelte class 格式）
    // App Store 使用 <div class="text-pair svelte-xxx"><span>名稱</span> <span>價格</span></div>
    $('[class*="text-pair"]').each((_, el) => {
      const spans = $(el).find("span");
      if (spans.length >= 2) {
        const name = $(spans[0]).text().trim();
        const priceText = $(spans[1]).text().trim();
        if (name && priceText && priceText !== name && priceText.length > 0) {
          // 偵測實際貨幣（有些國家用 USD 計價）
          const detectedCurrency = detectCurrencyFromPrice(priceText, country.currency);
          const parsed = parsePrice(priceText, detectedCurrency);
          if (parsed !== null) {
            items.push({
              name,
              price: parsed,
              currency: detectedCurrency,
              formattedPrice: priceText,
            });
          }
        }
      }
    });

    // 方法二：從 JSON 資料中提取（備用）
    if (items.length === 0) {
      const jsonMatch = html.match(/<script[^>]*id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/);
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

// 從價格文字偵測實際貨幣（有些國家的 App Store 用 USD 計價）
// 常見貨幣符號對應表
const SYMBOL_TO_CURRENCY: Record<string, string> = {
  "$": "USD",   // 美元符號（預設，如果國家本身就是 USD 則保留）
  "€": "EUR",   "\u00a3": "GBP",   "¥": "JPY",
  "₩": "KRW",   "₹": "INR",   "₺": "TRY",
  "₽": "RUB",   "₴": "UAH",   "₸": "KZT",
  "₼": "AZN",   "₾": "GEL",   "₯": "GRD",
  "₦": "NGN",   "₨": "PKR",   "₱": "PHP",
  "₫": "VND",   "₪": "ILS",   "₧": "ESP",
  "฿": "THB",   "៛": "KHR",   "₮": "MNT",
  "₭": "LAK",   "₲": "PYG",   "₳": "ARS",
  "₵": "GHS",   "₶": "LVL",   "₷": "PHP",
};

// 非標準貨幣代碼對應表（某些地區 App Store 使用非 ISO 格式）
const NON_STANDARD_CURRENCY_CODES: Record<string, string> = {
  "$US": "USD",
  "US$": "USD",
  "A$": "AUD",
  "CA$": "CAD",
  "HK$": "HKD",
  "NZ$": "NZD",
  "S$": "SGD",
  "R$": "BRL",
  "MX$": "MXN",
  "COP$": "COP",
  "CLP$": "CLP",
  "ARS$": "ARS",
};

function detectCurrencyFromPrice(priceText: string, defaultCurrency: string): string {
  // 先將 NBSP (\xa0) 和其他不可見空白替換成普通空格
  const text = priceText.replace(/[\u00a0\u202f\u2009\u2007\u2008]/g, " ").trim();

  // 1. 前置非標準代碼（如 $US 4.99、US$ 4.99）
  for (const [code, currency] of Object.entries(NON_STANDARD_CURRENCY_CODES)) {
    const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`^${escaped}\\s*[\\d]`).test(text)) return currency;
  }

  // 2. 前置標準貨幣代碼（如 USD 4.99）
  const prefixCodeMatch = text.match(/^([A-Z]{3})\s+[\d]/);
  if (prefixCodeMatch) return prefixCodeMatch[1];

  // 3. 後置非標準代碼（如 1,99 $US、5,99 $US）
  for (const [code, currency] of Object.entries(NON_STANDARD_CURRENCY_CODES)) {
    const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`[\\d]\\s*${escaped}$`).test(text)) return currency;
  }

  // 4. 後置標準貨幣代碼（如 0,49 USD 或 0.39 USD）
  const suffixCodeMatch = text.match(/[\d][\d.,]*\s+([A-Z]{3})$/);
  if (suffixCodeMatch) return suffixCodeMatch[1];

  // 5. 後置貨幣符號（如 0,39 € 或 0.49£）
  const suffixSymbolMatch = text.match(/[\d][\d.,]*\s*([^\d.,\s]+)$/);
  if (suffixSymbolMatch) {
    const sym = suffixSymbolMatch[1].trim();
    if (SYMBOL_TO_CURRENCY[sym]) return SYMBOL_TO_CURRENCY[sym];
  }

  // 6. 前置美元符號 $：如果國家本身不是 USD，則視為 USD 計價
  if (text.startsWith("$") && defaultCurrency !== "USD") {
    return "USD";
  }

  return defaultCurrency;
}

function parsePrice(priceText: string, currency: string): number | null {
  // 將 NBSP (\xa0) 和其他不可見空白替換成普通空格
  const text = priceText.replace(/[\u00a0\u202f\u2009\u2007\u2008]/g, " ").trim();

  // 特殊格式：印尼 ribu（千）
  const ribuMatch = text.match(/([\d.,]+)\s*ribu/i);
  if (ribuMatch) {
    const numStr = ribuMatch[1].replace(/[.,]/g, "");
    const num = parseFloat(numStr) * 1000;
    return isNaN(num) || num <= 0 ? null : Math.round(num);
  }

  // 移除所有非數字字元（保留 . 和 ,）
  let cleaned = text.replace(/^[^\d]+/, ""); // 移除開頭非數字
  cleaned = cleaned.replace(/[^\d.,]/g, ""); // 移除剩餘非數字

  if (!cleaned) return null;

  // 無小數點貨幣列表（提前宣告以便判斷千分位 vs 小數點）
  const noDecimalCurrenciesCheck = ["JPY","KRW","IDR","VND","CLP","PYG","UGX","RWF","KHR","MMK","LAK","MNT","ISK","XAF","XOF","MGA","SLL","LBP","IQD","IRR","YER","DZD","UZS"];
  const isNoDecimal = noDecimalCurrenciesCheck.includes(currency);

  const dotCount = cleaned.split(".").length - 1;
  const commaCount = cleaned.split(",").length - 1;

  if (dotCount > 1) {
    // 多個點：點是千分位，移除
    cleaned = cleaned.replace(/\./g, "");
  } else if (commaCount > 1) {
    // 多個逧號：逧號是千分位，移除
    cleaned = cleaned.replace(/,/g, "");
  } else if (dotCount === 1 && commaCount === 1) {
    const dotPos = cleaned.lastIndexOf(".");
    const commaPos = cleaned.lastIndexOf(",");
    if (dotPos > commaPos) {
      // 點在後：逧號是千分位
      cleaned = cleaned.replace(/,/g, "");
    } else {
      // 逧號在後：點是千分位，逧號是小數點
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    }
  } else if (dotCount === 1) {
    const parts = cleaned.split(".");
    if (parts[1] && parts[1].length === 3 && parts[0].length > 0 && isNoDecimal) {
      // 無小數點貨幣（如 IDR）：.XXX 是千分位
      cleaned = cleaned.replace(".", "");
    }
    // 對於有小數點的貨幣，保留原樣（點是小數點）
  } else if (commaCount === 1) {
    const parts = cleaned.split(",");
    if (parts[1] && parts[1].length === 3 && parts[0].length > 0) {
      // 千分位
      cleaned = cleaned.replace(",", "");
    } else {
      // 小數點
      cleaned = cleaned.replace(",", ".");
    }
  }

  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return null;

  // 無小數點貨幣
  const noDecimalCurrencies = ["JPY", "KRW", "IDR", "VND", "CLP", "PYG", "UGX", "RWF", "KHR", "MMK", "LAK", "MNT", "ISK", "XAF", "XOF", "MGA", "SLL", "LBP", "IQD", "IRR", "YER", "DZD", "UZS"];
  if (noDecimalCurrencies.includes(currency)) {
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
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") {
      extractIAPFromJson(val, currency, items);
    }
  }
}

// 並行爬取多國 IAP 資料（分批避免過多並發）
export async function scrapeAllCountriesIAP(appId: string, countryCodes?: string[]): Promise<CountryIAPResult[]> {
  const targets = countryCodes
    ? SUPPORTED_COUNTRIES.filter((c) => countryCodes.includes(c.code))
    : [...SUPPORTED_COUNTRIES];

  // 分批處理，每批 20 個，避免同時發出太多請求
  const BATCH_SIZE = 20;
  const allResults: CountryIAPResult[] = [];

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map(async (country) => {
        const items = await scrapeCountryIAP(appId, country.code);
        return {
          countryCode: country.code,
          countryName: country.name,
          currency: country.currency,
          symbol: country.symbol,
          flag: country.flag,
          region: country.region,
          items,
        } as CountryIAPResult;
      })
    );

    batchResults.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        allResults.push(result.value);
      } else {
        allResults.push({
          countryCode: batch[idx].code,
          countryName: batch[idx].name,
          currency: batch[idx].currency,
          symbol: batch[idx].symbol,
          flag: batch[idx].flag,
          region: batch[idx].region,
          items: [],
          error: result.reason instanceof Error ? result.reason.message : "查詢失敗",
        });
      }
    });
  }

  return allResults;
}
