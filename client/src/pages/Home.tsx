import { useState, useRef, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  TrendingDown,
  Clock,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Globe,
  ShoppingBag,
  AlertCircle,
  X,
  Filter,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppInfo {
  id: string;
  name: string;
  icon: string;
  developer: string;
  genre: string;
  url: string;
}

interface IAPItemWithTWD {
  name: string;
  price: number;
  currency: string;
  formattedPrice: string;
  twdAmount: number;
  twdFormatted: string;
}

interface CountryResult {
  countryCode: string;
  countryName: string;
  currency: string;
  symbol: string;
  flag: string;
  region: string;
  items: IAPItemWithTWD[];
  error?: string;
}

interface CompareResult {
  appId: string;
  countries: CountryResult[];
  exchangeSource: string;
  ratesUpdatedAt: number;
}

interface ComparisonRow {
  key: string;
  displayName: string;
  countryPrices: Map<string, { twd: number; formatted: string; originalName?: string }>;
  minTWD: number;
  cheapestCountries: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeIAPName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * 從商品名稱中提取「主要數字」作為分組 key。
 *
 * 策略：
 * 1. 移除千分位符號後，提取所有數字序列
 * 2. 取「最大的數字」（通常是面額，如 6480、400、1980）
 * 3. 過濾掉 1-2 位的短數字（可能是序號，如 Bundle12 中的 12）
 *    但若名稱中只有短數字，仍回傳（避免全部退回名稱比對）
 * 4. 若無數字 → 回傳 null，退回名稱比對
 *
 * 注意：Bundle12 和 Bundle22 中的 12/22 都是短數字，
 * 若過濾後無顯著數字，回傳 null，讓它們用名稱比對（不強行合併）。
 */
function extractNumericKey(name: string): string | null {
  const cleaned = name.replace(/[,，.]/g, "");
  const numbers = cleaned.match(/\d+/g);
  if (!numbers || numbers.length === 0) return null;
  // 過濾掉 1-3 位的短數字（可能是序號或版本號）
  const significant = numbers.filter((n) => n.length >= 3);
  if (significant.length === 0) return null; // 沒有顯著數字，退回名稱比對
  // 取最大值（面額通常是最大的數字）
  return significant.reduce((max, n) =>
    parseInt(n, 10) > parseInt(max, 10) ? n : max
  );
}

/**
 * 判斷名稱是否為中文（繁體或簡體）
 */
function isChinese(name: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(name);
}

function buildComparisonTable(countries: CountryResult[]): ComparisonRow[] {
  // ============================================================
  // 分組策略：
  // 1. 先嘗試用「顯著數字 key」分組（合併同面額不同語言名稱）
  //    - 顯著數字：3位以上（如 400、1980、6480）
  //    - 短數字（如 Bundle12 的 12）不作為分組 key
  // 2. 若無顯著數字，退回「正規化名稱」分組
  //
  // 命名策略（強制台灣/香港中文優先）：
  // 1. 優先使用台灣 (tw) 的名稱
  // 2. 其次使用香港 (hk) 的名稱
  // 3. 若都沒有，使用任何中文名稱
  // 4. 最後才使用英文名稱
  // ============================================================
  const itemMap = new Map<string, {
    displayName: string;
    displayNamePriority: number; // 0=tw, 1=hk, 2=other-chinese, 3=english
    numericKey: string | null;
    countryPrices: Map<string, { twd: number; formatted: string; originalName: string }>;
  }>();

  for (const country of countries) {
    for (const item of country.items) {
      const numKey = extractNumericKey(item.name);
      const groupKey = numKey ? `num:${numKey}` : `name:${normalizeIAPName(item.name)}`;

      if (!itemMap.has(groupKey)) {
        itemMap.set(groupKey, {
          displayName: item.name,
          displayNamePriority: 99,
          numericKey: numKey,
          countryPrices: new Map(),
        });
      }

      const entry = itemMap.get(groupKey)!;

      // 計算此名稱的優先級
      let priority: number;
      if (country.countryCode === "tw") {
        priority = 0; // 台灣最優先
      } else if (country.countryCode === "hk") {
        priority = 1; // 香港其次
      } else if (isChinese(item.name)) {
        priority = 2; // 其他中文
      } else {
        priority = 3; // 英文或其他語言
      }

      // 優先級更高（數字更小）才更新顯示名稱
      if (priority < entry.displayNamePriority) {
        entry.displayName = item.name;
        entry.displayNamePriority = priority;
      }

      const existing = entry.countryPrices.get(country.countryCode);
      if (!existing || item.twdAmount < existing.twd) {
        entry.countryPrices.set(country.countryCode, {
          twd: item.twdAmount,
          formatted: item.formattedPrice,
          originalName: item.name,
        });
      }
    }
  }

  return Array.from(itemMap.entries())
    .map(([key, val]) => {
      const prices = Array.from(val.countryPrices.entries());
      const minTWD = Math.min(...prices.map(([, p]) => p.twd));
      const cheapestCountries = prices.filter(([, p]) => p.twd === minTWD).map(([code]) => code);
      return { key, displayName: val.displayName, countryPrices: val.countryPrices, minTWD, cheapestCountries };
    })
    .sort((a, b) => a.minTWD - b.minTWD);
}

// 搜尋起點國家選單（主流遇戲大國）
const SEARCH_COUNTRIES = [
  { code: "tw", name: "🇹🇼 台灣" },
  { code: "us", name: "🇺🇸 美國" },
  { code: "jp", name: "🇯🇵 日本" },
  { code: "kr", name: "🇰🇷 韓國" },
  { code: "hk", name: "🇭🇰 香港" },
  { code: "cn", name: "🇨🇳 中國" },
  { code: "sg", name: "🇸🇬 新加坡" },
  { code: "gb", name: "🇬🇧 英國" },
  { code: "de", name: "🇩🇪 德國" },
  { code: "au", name: "🇦🇺 澳洲" },
  { code: "ca", name: "🇨🇦 加拿大" },
  { code: "fr", name: "🇫🇷 法國" },
] as const;

const REGIONS = ["全部", "亞太", "歐洲", "美洲", "中東", "非洲"] as const;
type Region = (typeof REGIONS)[number];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PriceTableRowProps {
  item: ComparisonRow;
  countries: CountryResult[];
  selectedRegion: Region;
  showOnlyWithData: boolean;
  onRegionChange: (r: Region) => void;
  onShowOnlyChange: (v: boolean) => void;
}

function PriceTableRow({ item, countries, selectedRegion, showOnlyWithData, onRegionChange, onShowOnlyChange }: PriceTableRowProps) {
  const [expanded, setExpanded] = useState(false);

  const allPrices = useMemo(() => {
    return Array.from(item.countryPrices.entries())
      .map(([code, price]) => {
        const country = countries.find((c) => c.countryCode === code);
        return { code, price, country };
      })
      .sort((a, b) => a.price.twd - b.price.twd);
  }, [item.countryPrices, countries]);

  const filteredPrices = useMemo(() => {
    let list = allPrices;
    if (selectedRegion !== "全部") {
      list = list.filter((p) => p.country?.region === selectedRegion);
    }
    return list;
  }, [allPrices, selectedRegion]);

  const cheapestTWD = allPrices[0]?.price.twd ?? 0;
  const mostExpensiveTWD = allPrices[allPrices.length - 1]?.price.twd ?? 0;

  return (
    <div className="border-b border-border last:border-0">
      {/* Summary row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{item.displayName}</span>
            <Badge className="text-xs bg-emerald-900/50 text-emerald-300 border-emerald-700/50">
              最低 NT${item.minTWD.toLocaleString("zh-TW")}
            </Badge>
            {mostExpensiveTWD > cheapestTWD && cheapestTWD > 0 && (
              <span className="text-xs text-muted-foreground">
                最高可省{" "}
                <span className="text-amber-400">
                  {Math.round(((mostExpensiveTWD - cheapestTWD) / mostExpensiveTWD) * 100)}%
                </span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {item.cheapestCountries.slice(0, 3).map((cc) => {
              const c = countries.find((x) => x.countryCode === cc);
              return c ? (
                <span key={`cheapest-${item.key}-${cc}`} className="text-xs text-emerald-400">
                  {c.flag} {c.countryName}
                </span>
              ) : null;
            })}
            {item.cheapestCountries.length > 3 && (
              <span className="text-xs text-muted-foreground">+{item.cheapestCountries.length - 3} 個</span>
            )}
            <span className="text-xs text-muted-foreground">最便宜</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">{allPrices.length} 國</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="bg-background/50 border-t border-border">
          {/* Region filter */}
          <div className="px-4 pt-2 pb-1 flex gap-1 flex-wrap border-b border-border/50 items-center">
            <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1 flex-shrink-0" />
            {REGIONS.map((r) => {
              const count =
                r === "全部"
                  ? allPrices.length
                  : allPrices.filter((p) => p.country?.region === r).length;
              if (count === 0 && r !== "全部") return null;
              return (
                <button
                  key={`region-${r}`}
                  onClick={() => onRegionChange(r)}
                  className={`text-xs px-2 py-0.5 rounded transition-colors ${
                    selectedRegion === r
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r} ({count})
                </button>
              );
            })}
            <label className="ml-auto flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showOnlyWithData}
                onChange={(e) => onShowOnlyChange(e.target.checked)}
                className="w-3 h-3"
              />
              只顯示有資料
            </label>
          </div>

          {/* Price table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground w-8">#</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">國家/地區</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">地區</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">原始價格</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">換算台幣</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">比最低貴</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrices.map(({ code, price, country }, idx) => {
                  const isCheapest = item.cheapestCountries.includes(code);
                  const diffPct =
                    cheapestTWD > 0
                      ? Math.round(((price.twd - cheapestTWD) / cheapestTWD) * 100)
                      : 0;
                  return (
                    <tr
                      key={`row-${item.key}-${code}`}
                      className={`border-b border-border/50 last:border-0 ${
                        isCheapest ? "bg-emerald-950/20" : "hover:bg-accent/20"
                      }`}
                    >
                      <td className="px-4 py-2 text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{country?.flag}</span>
                          <div>
                            <span
                              className={`text-sm ${
                                isCheapest ? "text-emerald-300 font-medium" : "text-foreground"
                              }`}
                            >
                              {country?.countryName ?? code}
                            </span>
                            {isCheapest && (
                              <Badge className="ml-2 text-xs bg-emerald-900/60 text-emerald-300 border-emerald-700/50 py-0">
                                最便宜
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {country?.region ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-muted-foreground">
                        {price.formatted}
                      </td>
                      <td
                        className={`px-4 py-2 text-right text-sm font-medium ${
                          isCheapest ? "text-emerald-300" : "text-foreground"
                        }`}
                      >
                        NT${price.twd.toLocaleString("zh-TW")}
                      </td>
                      <td className="px-4 py-2 text-right text-xs">
                        {isCheapest ? (
                          <span className="text-emerald-400">—</span>
                        ) : (
                          <span
                            className={
                              diffPct > 100
                                ? "text-red-400"
                                : diffPct > 50
                                ? "text-amber-400"
                                : "text-muted-foreground"
                            }
                          >
                            +{diffPct}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AppInfo[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region>("全部");
  const [showOnlyWithData, setShowOnlyWithData] = useState(true);
  const [searchCountry, setSearchCountry] = useState("tw"); // 搜尋起點國家
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchQuery = trpc.appstore.search.useQuery({ term: searchTerm, country: searchCountry }, { enabled: false });
  const compareMutation = trpc.appstore.compareIAP.useMutation();
  const historyQuery = trpc.history.list.useQuery(undefined, { enabled: showHistory });
  const deleteHistoryMutation = trpc.history.delete.useMutation({
    onSuccess: () => historyQuery.refetch(),
  });
  const clearHistoryMutation = trpc.history.clear.useMutation({
    onSuccess: () => historyQuery.refetch(),
  });

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedApp(null);
    setCompareResult(null);
    setSearchError(null);
    setCompareError(null);
    try {
      const result = await searchQuery.refetch();
      if (result.data) {
        setSearchResults(result.data as AppInfo[]);
        if (result.data.length === 0) {
          setSearchError("找不到相關遇戲，請嘗試其他關鍵字");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "搜尋失敗";
      setSearchError(`搜尋失敗：${msg}。請檢查網路連線或稍後再試。`);
      toast.error("搜尋失敗，請稍後再試");
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, searchQuery]);

  const handleSelectApp = useCallback(
    async (app: AppInfo) => {
      setSelectedApp(app);
      setSearchResults([]);
      setCompareResult(null);
      setCompareError(null);
      setIsComparing(true);
      try {
        const result = await compareMutation.mutateAsync({
          appId: app.id,
          appName: app.name,
          appIcon: app.icon,
          developer: app.developer,
        });
        setCompareResult(result as CompareResult);
        if (showHistory) historyQuery.refetch();
      } catch (err) {
        // 直接顯示真實錯誤，方便除錯
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[compareIAP Error]", err);
        setCompareError(`查詢失敗：${msg}`);
        toast.error("比價失敗，請稍後再試");
      } finally {
        setIsComparing(false);
      }
    },
    [compareMutation, showHistory, historyQuery]
  );

  const handleHistoryClick = useCallback(
    async (appId: string, appName: string, appIcon?: string | null, developer?: string | null) => {
      const app: AppInfo = {
        id: appId,
        name: appName,
        icon: appIcon ?? "",
        developer: developer ?? "",
        genre: "",
        url: "",
      };
      setSearchTerm(appName);
      await handleSelectApp(app);
    },
    [handleSelectApp]
  );

  const comparisonTable = useMemo(
    () => (compareResult ? buildComparisonTable(compareResult.countries) : []),
    [compareResult]
  );

  const availableCountries = useMemo(
    () => (compareResult ? compareResult.countries.filter((c) => c.items.length > 0) : []),
    [compareResult]
  );

  const topCheapCountries = useMemo(() => {
    const cheapCountMap = new Map<string, number>();
    for (const item of comparisonTable) {
      for (const cc of item.cheapestCountries) {
        cheapCountMap.set(cc, (cheapCountMap.get(cc) ?? 0) + 1);
      }
    }
    return Array.from(cheapCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [comparisonTable]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-none">App Store 比價工具</h1>
              <p className="text-xs text-muted-foreground mt-0.5">全球 130+ 國家內購價格比較 · 換算台幣</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory((v) => !v)}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">歷史記錄</span>
          </Button>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Search bar */}
        <div className="max-w-2xl mx-auto space-y-3">
          {/* 搜尋起點國家切換 */}
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground flex-shrink-0">搜尋地區：</span>
            <Select value={searchCountry} onValueChange={(v) => { setSearchCountry(v); setSearchResults([]); }}>
              <SelectTrigger className="h-7 w-auto min-w-[120px] text-xs bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="text-xs">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">— 切換可搜尋日本、美區等地區獨家遇戲</span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="輸入遇戲名稱（如：絕區零、原神）或 App ID"
                className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
              className="gap-2 min-w-[80px]"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              搜尋
            </Button>
          </div>

          {/* Search error */}
          {searchError && searchResults.length === 0 && !isSearching && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{searchError}</p>
            </div>
          )}

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">找到 {searchResults.length} 個結果</span>
                <button
                  onClick={() => setSearchResults([])}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {searchResults.map((app) => (
                  <button
                    key={`search-${app.id}`}
                    onClick={() => handleSelectApp(app)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left"
                  >
                    {app.icon ? (
                      <img src={app.icon} alt={app.name} className="w-10 h-10 rounded-xl flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{app.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.developer} · {app.genre}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      ID: {app.id}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">查詢歷史</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending}
                className="text-xs text-muted-foreground hover:text-destructive gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                清除全部
              </Button>
            </div>
            {historyQuery.isLoading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : historyQuery.data && historyQuery.data.length > 0 ? (
              <div className="divide-y divide-border">
                {historyQuery.data.map((item) => (
                  <div
                    key={`history-${item.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 group"
                  >
                    <button
                      onClick={() =>
                        handleHistoryClick(item.appId, item.appName, item.appIcon, item.developer)
                      }
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      {item.appIcon ? (
                        <img
                          src={item.appIcon}
                          alt={item.appName}
                          className="w-8 h-8 rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{item.appName}</p>
                        <p className="text-xs text-muted-foreground">{item.developer ?? "未知開發商"}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => deleteHistoryMutation.mutate({ id: item.id })}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">尚無查詢記錄</div>
            )}
          </div>
        )}

        {/* Compare error */}
        {compareError && !isComparing && selectedApp && !compareResult && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive mb-1">查詢失敗</p>
                  <p className="text-sm text-destructive/80">{compareError}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCompareError(null);
                    handleSelectApp(selectedApp);
                  }}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  重新查詢
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCompareError(null);
                    setSelectedApp(null);
                  }}
                  className="text-xs text-muted-foreground"
                >
                  返回搜尋
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isComparing && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Globe className="w-12 h-12 text-muted-foreground" />
                  <Loader2 className="w-6 h-6 text-primary animate-spin absolute -top-1 -right-1" />
                </div>
              </div>
              <div>
                <p className="text-foreground font-medium">正在查詢全球 App Store 價格...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  同時爬取 130+ 個國家/地區的內購資料，請稍候約 15-30 秒
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-1">
                {["🇹🇼","🇯🇵","🇺🇸","🇬🇧","🇩🇪","🇫🇷","🇰🇷","🇨🇳","🇭🇰","🇸🇬","🇦🇺","🇮🇳","🇧🇷","🇲🇽","🇦🇷","🇹🇷","🇷🇺","🇸🇦","🇦🇪","🇿🇦","🇳🇬","🇰🇪","🇵🇱","🇸🇪","🇳🇴"].map((flag, i) => (
                  <span
                    key={`loading-flag-${i}`}
                    className="text-lg opacity-50 animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {compareResult && !isComparing && selectedApp && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* App info card */}
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              {selectedApp.icon ? (
                <img
                  src={selectedApp.icon}
                  alt={selectedApp.name}
                  className="w-14 h-14 rounded-2xl flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Globe className="w-7 h-7 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground">{selectedApp.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedApp.developer}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">
                    查詢 {compareResult.countries.length} 個國家 · 取得 {availableCountries.length} 個有資料
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {compareResult.exchangeSource === "api" ? "✓ 即時匯率" : "⚠ 備用匯率"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectApp(selectedApp)}
                    className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground px-2"
                  >
                    <RefreshCw className="w-3 h-3" />
                    重新查詢
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            {comparisonTable.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">內購項目</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{comparisonTable.length}</p>
                </div>
                <div className="bg-card border border-border rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">有資料國家</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{availableCountries.length}</p>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-emerald-400 mb-1">最常最便宜的國家</p>
                  <div className="flex flex-wrap gap-2">
                    {topCheapCountries.map(([cc, count]) => {
                      const c = compareResult.countries.find((x) => x.countryCode === cc);
                      return c ? (
                        <span key={`top-cheap-${cc}`} className="text-sm text-emerald-300 font-medium">
                          {c.flag} {c.countryName}
                          <span className="text-xs text-emerald-500 ml-1">({count}項)</span>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Comparison table */}
            {comparisonTable.length > 0 ? (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">各國內購價格比較</span>
                  </div>
                  <span className="text-xs text-muted-foreground">所有價格換算為 TWD · 點擊展開詳細</span>
                </div>

                <div>
                  {comparisonTable.map((item) => (
                    <PriceTableRow
                      key={`iap-${item.key}`}
                      item={item}
                      countries={compareResult.countries}
                      selectedRegion={selectedRegion}
                      showOnlyWithData={showOnlyWithData}
                      onRegionChange={setSelectedRegion}
                      onShowOnlyChange={setShowOnlyWithData}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-foreground font-medium">未找到內購項目</p>
                <p className="text-sm text-muted-foreground">
                  此遊戲可能沒有內購，或各國 App Store 頁面格式不同
                </p>
              </div>
            )}

            {/* No-data countries summary */}
            {compareResult.countries.filter((c) => c.items.length === 0).length > 0 && (
              <details className="bg-card/50 border border-border/50 rounded-lg">
                <summary className="px-4 py-2.5 text-xs text-muted-foreground cursor-pointer">
                  <span className="text-amber-400">⚠</span>{" "}
                  {compareResult.countries.filter((c) => c.items.length === 0).length}{" "}
                  個地區未取得資料（點擊展開）
                </summary>
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {compareResult.countries
                    .filter((c) => c.items.length === 0)
                    .map((c) => (
                      <span
                        key={`nodata-${c.countryCode}`}
                        className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded"
                      >
                        {c.flag} {c.countryName}
                      </span>
                    ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Welcome screen */}
        {!selectedApp && !isComparing && searchResults.length === 0 && (
          <div className="max-w-2xl mx-auto text-center py-12 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <TrendingDown className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">找到最划算的購買地區</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                輸入遊戲名稱，自動比較全球 130+ 個國家/地區的 App Store 內購價格，
                換算成台幣後告訴你哪個國家最便宜。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: "🔍", label: "搜尋遊戲", desc: "輸入名稱或 App ID" },
                { icon: "🌍", label: "全球比價", desc: "130+ 個國家同時查詢" },
                { icon: "💰", label: "台幣換算", desc: "即時匯率自動換算" },
              ].map((f) => (
                <div key={`feature-${f.label}`} className="bg-card border border-border rounded-lg p-3 space-y-1">
                  <div className="text-2xl">{f.icon}</div>
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              試試看：
              <button onClick={() => setSearchTerm("絕區零")} className="text-primary hover:underline mx-1">
                絕區零
              </button>
              、
              <button onClick={() => setSearchTerm("原神")} className="text-primary hover:underline mx-1">
                原神
              </button>
              、
              <button
                onClick={() => setSearchTerm("Clash of Clans")}
                className="text-primary hover:underline mx-1"
              >
                Clash of Clans
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-border mt-12 py-4">
        <div className="container text-center text-xs text-muted-foreground">
          資料來源：Apple App Store 各國官方頁面 · 匯率來源：open.er-api.com · 僅供參考，實際價格以 App Store 為準
        </div>
      </footer>
    </div>
  );
}
