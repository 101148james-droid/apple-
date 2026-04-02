import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

function normalizeIAPName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildComparisonTable(countries: CountryResult[]) {
  const itemMap = new Map<
    string,
    { displayName: string; countryPrices: Map<string, { twd: number; formatted: string }> }
  >();

  for (const country of countries) {
    for (const item of country.items) {
      const key = normalizeIAPName(item.name);
      if (!itemMap.has(key)) {
        itemMap.set(key, { displayName: item.name, countryPrices: new Map() });
      }
      const entry = itemMap.get(key)!;
      const existing = entry.countryPrices.get(country.countryCode);
      if (!existing || item.twdAmount < existing.twd) {
        entry.countryPrices.set(country.countryCode, {
          twd: item.twdAmount,
          formatted: item.formattedPrice,
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

const REGIONS = ["全部", "亞太", "歐洲", "美洲", "中東", "非洲"];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<AppInfo[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedRegion, setSelectedRegion] = useState("全部");
  const [showOnlyWithData, setShowOnlyWithData] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchMutation = trpc.appstore.search.useQuery({ term: searchTerm }, { enabled: false });
  const compareMutation = trpc.appstore.compareIAP.useMutation();
  const historyQuery = trpc.history.list.useQuery(undefined, { enabled: showHistory });
  const deleteHistoryMutation = trpc.history.delete.useMutation({ onSuccess: () => historyQuery.refetch() });
  const clearHistoryMutation = trpc.history.clear.useMutation({ onSuccess: () => historyQuery.refetch() });

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedApp(null);
    setCompareResult(null);
    try {
      const result = await searchMutation.refetch();
      if (result.data) {
        setSearchResults(result.data as AppInfo[]);
        if (result.data.length === 0) toast.info("找不到相關遊戲，請嘗試其他關鍵字");
      }
    } catch {
      toast.error("搜尋失敗，請稍後再試");
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, searchMutation]);

  const handleSelectApp = useCallback(
    async (app: AppInfo) => {
      setSelectedApp(app);
      setSearchResults([]);
      setCompareResult(null);
      setExpandedItems(new Set());
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
      } catch {
        toast.error("比價失敗，請稍後再試");
      } finally {
        setIsComparing(false);
      }
    },
    [compareMutation, showHistory, historyQuery]
  );

  const handleHistoryClick = useCallback(
    async (appId: string, appName: string, appIcon?: string | null, developer?: string | null) => {
      const app: AppInfo = { id: appId, name: appName, icon: appIcon || "", developer: developer || "", genre: "", url: "" };
      setSearchTerm(appName);
      await handleSelectApp(app);
    },
    [handleSelectApp]
  );

  const toggleItem = (key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const comparisonTable = compareResult ? buildComparisonTable(compareResult.countries) : [];
  const availableCountries = compareResult ? compareResult.countries.filter((c) => c.items.length > 0) : [];
  const totalCountries = compareResult ? compareResult.countries.length : 0;

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
            onClick={() => setShowHistory(!showHistory)}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">歷史記錄</span>
          </Button>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Search */}
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="輸入遊戲名稱（如：絕區零、原神）或 App ID"
                className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()} className="gap-2 min-w-[80px]">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              搜尋
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-xs text-muted-foreground">找到 {searchResults.length} 個結果</span>
                <button onClick={() => setSearchResults([])} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {searchResults.map((app) => (
                  <button
                    key={app.id}
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
                      <p className="text-xs text-muted-foreground truncate">{app.developer} · {app.genre}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">ID: {app.id}</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History */}
        {showHistory && (
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">查詢歷史</span>
              </div>
              <Button
                variant="ghost" size="sm"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending}
                className="text-xs text-muted-foreground hover:text-destructive gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />清除全部
              </Button>
            </div>
            {historyQuery.isLoading ? (
              <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : historyQuery.data && historyQuery.data.length > 0 ? (
              <div className="divide-y divide-border">
                {historyQuery.data.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 group">
                    <button
                      onClick={() => handleHistoryClick(item.appId, item.appName, item.appIcon, item.developer)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      {item.appIcon ? (
                        <img src={item.appIcon} alt={item.appName} className="w-8 h-8 rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{item.appName}</p>
                        <p className="text-xs text-muted-foreground">{item.developer || "未知開發商"}</p>
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

        {/* Loading */}
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
                <p className="text-sm text-muted-foreground mt-1">同時爬取 130+ 個國家/地區的內購資料，請稍候約 15-30 秒</p>
              </div>
              <div className="flex flex-wrap justify-center gap-1">
                {["🇹🇼","🇯🇵","🇺🇸","🇬🇧","🇩🇪","🇫🇷","🇰🇷","🇨🇳","🇭🇰","🇸🇬","🇦🇺","🇮🇳","🇧🇷","🇲🇽","🇦🇷","🇹🇷","🇷🇺","🇸🇦","🇦🇪","🇿🇦","🇳🇬","🇰🇪","🇵🇱","🇸🇪","🇳🇴"].map((flag, i) => (
                  <span key={i} className="text-lg opacity-50 animate-pulse" style={{ animationDelay: `${i * 80}ms` }}>{flag}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {compareResult && !isComparing && selectedApp && (
          <div className="max-w-5xl mx-auto space-y-4">
            {/* App Info */}
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              {selectedApp.icon ? (
                <img src={selectedApp.icon} alt={selectedApp.name} className="w-14 h-14 rounded-2xl flex-shrink-0" />
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
                    查詢 {totalCountries} 個國家 · 取得 {availableCountries.length} 個有資料
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {compareResult.exchangeSource === "api" ? "✓ 即時匯率" : "⚠ 備用匯率"}
                  </span>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleSelectApp(selectedApp)}
                    className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground px-2"
                  >
                    <RefreshCw className="w-3 h-3" />重新查詢
                  </Button>
                </div>
              </div>
            </div>

            {/* Stats */}
            {comparisonTable.length > 0 && (() => {
              const cheapCountMap = new Map<string, number>();
              for (const item of comparisonTable) {
                for (const cc of item.cheapestCountries) {
                  cheapCountMap.set(cc, (cheapCountMap.get(cc) || 0) + 1);
                }
              }
              const topCheap = Array.from(cheapCountMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
              return (
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
                      {topCheap.map(([cc, count]) => {
                        const c = compareResult.countries.find((x) => x.countryCode === cc);
                        return c ? (
                          <span key={cc} className="text-sm text-emerald-300 font-medium">
                            {c.flag} {c.countryName}
                            <span className="text-xs text-emerald-500 ml-1">({count}項)</span>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Comparison Table */}
            {comparisonTable.length > 0 ? (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">各國內購價格比較</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">所有價格換算為 TWD</span>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {comparisonTable.map((item) => {
                    const isExpanded = expandedItems.has(item.key);
                    const allPrices = Array.from(item.countryPrices.entries())
                      .map(([code, price]) => {
                        const country = compareResult.countries.find((c) => c.countryCode === code);
                        return { code, price, country };
                      })
                      .sort((a, b) => a.price.twd - b.price.twd);

                    // 依地區篩選
                    const filteredPrices = selectedRegion === "全部"
                      ? allPrices
                      : allPrices.filter((p) => p.country?.region === selectedRegion);

                    const cheapestTWD = allPrices[0]?.price.twd || 0;
                    const mostExpensiveTWD = allPrices[allPrices.length - 1]?.price.twd || 0;

                    return (
                      <div key={item.key}>
                        <button
                          onClick={() => toggleItem(item.key)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-foreground">{item.displayName}</span>
                              <Badge className="text-xs bg-emerald-900/50 text-emerald-300 border-emerald-700/50">
                                最低 NT${item.minTWD.toLocaleString("zh-TW")}
                              </Badge>
                              {mostExpensiveTWD > cheapestTWD && (
                                <span className="text-xs text-muted-foreground">
                                  最高可省 <span className="text-amber-400">{Math.round(((mostExpensiveTWD - cheapestTWD) / mostExpensiveTWD) * 100)}%</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {item.cheapestCountries.slice(0, 3).map((cc) => {
                                const c = compareResult.countries.find((x) => x.countryCode === cc);
                                return c ? (
                                  <span key={cc} className="text-xs text-emerald-400">{c.flag} {c.countryName}</span>
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
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="bg-background/50 border-t border-border">
                            {/* Region filter tabs */}
                            <div className="px-4 pt-2 pb-1 flex gap-1 flex-wrap border-b border-border/50">
                              <Filter className="w-3.5 h-3.5 text-muted-foreground self-center mr-1" />
                              {REGIONS.map((r) => {
                                const count = r === "全部"
                                  ? allPrices.length
                                  : allPrices.filter((p) => p.country?.region === r).length;
                                if (count === 0 && r !== "全部") return null;
                                return (
                                  <button
                                    key={r}
                                    onClick={() => setSelectedRegion(r)}
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
                                  onChange={(e) => setShowOnlyWithData(e.target.checked)}
                                  className="w-3 h-3"
                                />
                                只顯示有資料
                              </label>
                            </div>
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
                                    const diffPct = cheapestTWD > 0 ? Math.round(((price.twd - cheapestTWD) / cheapestTWD) * 100) : 0;
                                    return (
                                      <tr
                                        key={code}
                                        className={`border-b border-border/50 last:border-0 ${isCheapest ? "bg-emerald-950/20" : "hover:bg-accent/20"}`}
                                      >
                                        <td className="px-4 py-2 text-xs text-muted-foreground">{idx + 1}</td>
                                        <td className="px-4 py-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-base">{country?.flag}</span>
                                            <div>
                                              <span className={`text-sm ${isCheapest ? "text-emerald-300 font-medium" : "text-foreground"}`}>
                                                {country?.countryName}
                                              </span>
                                              {isCheapest && (
                                                <Badge className="ml-2 text-xs bg-emerald-900/60 text-emerald-300 border-emerald-700/50 py-0">最便宜</Badge>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-2 text-xs text-muted-foreground">{country?.region}</td>
                                        <td className="px-4 py-2 text-right text-sm text-muted-foreground">{price.formatted}</td>
                                        <td className={`px-4 py-2 text-right text-sm font-medium ${isCheapest ? "text-emerald-300" : "text-foreground"}`}>
                                          NT${price.twd.toLocaleString("zh-TW")}
                                        </td>
                                        <td className="px-4 py-2 text-right text-xs">
                                          {isCheapest ? (
                                            <span className="text-emerald-400">—</span>
                                          ) : (
                                            <span className={diffPct > 100 ? "text-red-400" : diffPct > 50 ? "text-amber-400" : "text-muted-foreground"}>
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
                  })}
                </div>

                <div className="px-4 py-2.5 border-t border-border flex gap-2">
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setExpandedItems(new Set(comparisonTable.map((i) => i.key)))}
                    className="text-xs text-muted-foreground gap-1"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />展開全部
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setExpandedItems(new Set())}
                    className="text-xs text-muted-foreground gap-1"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />收合全部
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-8 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-foreground font-medium">未找到內購項目</p>
                <p className="text-sm text-muted-foreground">此遊戲可能沒有內購，或各國 App Store 頁面格式不同</p>
              </div>
            )}

            {/* No data countries summary */}
            {compareResult.countries.filter((c) => c.items.length === 0).length > 0 && (
              <details className="bg-card/50 border border-border/50 rounded-lg">
                <summary className="px-4 py-2.5 text-xs text-muted-foreground cursor-pointer">
                  <span className="text-amber-400">⚠</span> {compareResult.countries.filter((c) => c.items.length === 0).length} 個地區未取得資料（點擊展開）
                </summary>
                <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                  {compareResult.countries
                    .filter((c) => c.items.length === 0)
                    .map((c) => (
                      <span key={c.countryCode} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {c.flag} {c.countryName}
                      </span>
                    ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Welcome */}
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
                <div key={f.label} className="bg-card border border-border rounded-lg p-3 space-y-1">
                  <div className="text-2xl">{f.icon}</div>
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              試試看：
              <button onClick={() => setSearchTerm("絕區零")} className="text-primary hover:underline mx-1">絕區零</button>、
              <button onClick={() => setSearchTerm("原神")} className="text-primary hover:underline mx-1">原神</button>、
              <button onClick={() => setSearchTerm("Clash of Clans")} className="text-primary hover:underline mx-1">Clash of Clans</button>
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
