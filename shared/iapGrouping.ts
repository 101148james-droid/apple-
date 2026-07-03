const PREMIUM_CURRENCY_WORDS = [
  /魔法石/i,
  /diamond(?:s)?/i,
  /prism(?:s)?/i,
  /delta\s+coin(?:s)?/i,
  /寶可金塊/i,
  /pok[eé]\s*gold/i,
  /pok[eé]\s*lingots?/i,
  /pok[eé]ling\./i,
  /pok[eé]lingotti/i,
  /pok[eé]lingotes/i,
  /pok[eé]\s*ouro/i,
  /pok[eé]ouro/i,
  /pok[eé]gold/i,
  /ポケゴールド/i,
  /포켓골드/i,
  /創世結晶/i,
  /genesis\s+crystal(?:s)?/i,
  /古老夢華/i,
  /夢華/i,
  /oneiric\s+shard(?:s)?/i,
  /crystal(?:s)?/i,
  /寶可幣/i,
  /pok[eé]coin(?:s)?/i,
  /pok[eé](?:piece(?:s)?|monete|münzen|munzen|monedas)/i,
  /ポケコイン/i,
  /coin(?:s)?/i,
];

const NON_CURRENCY_NUMBERED_WORDS = [
  /battle\s+pass/i,
  /pass/i,
  /ticket/i,
  /票券/i,
  /券/i,
  /禮包/i,
  /禮券/i,
  /gift\s+pack/i,
  /gift/i,
  /package/i,
  /pack/i,
  /bundle/i,
  /box/i,
  /monthly/i,
  /month/i,
  /subscription/i,
  /vip/i,
  /level/i,
  /\blv\.?\b/i,
];

type CurrencyFamily = "magic-stone" | "prism" | "delta-coin" | "pokemon-gold" | "genesis-crystal" | "oneiric-shard" | "pokemon-coin";

const CURRENCY_FAMILY_PATTERNS: Array<{
  family: CurrencyFamily;
  chineseName: string;
  patterns: RegExp[];
}> = [
  {
    family: "magic-stone",
    chineseName: "魔法石",
    patterns: [
      /魔法石/i,
      /diamond(?:s)?/i,
    ],
  },
  {
    family: "prism",
    chineseName: "稜鏡",
    patterns: [
      /稜鏡/i,
      /prism(?:s)?/i,
    ],
  },
  {
    family: "delta-coin",
    chineseName: "三角洲幣",
    patterns: [
      /三角洲幣/i,
      /delta\s+coin(?:s)?/i,
    ],
  },
  {
    family: "pokemon-gold",
    chineseName: "寶可金塊（付費）",
    patterns: [
      /寶可金塊/i,
      /pok[eé]\s*gold/i,
      /pok[eé]\s*lingots?/i,
      /pok[eé]ling\./i,
      /pok[eé]lingotti/i,
      /pok[eé]lingotes/i,
      /pok[eé]\s*ouro/i,
      /pok[eé]ouro/i,
      /pok[eé]gold/i,
      /ポケゴールド/i,
      /포켓골드/i,
    ],
  },
  {
    family: "genesis-crystal",
    chineseName: "創世結晶",
    patterns: [
      /創世結晶/i,
      /genesis\s+crystal(?:s)?/i,
      /schöpfungskristalle/i,
      /schopfungskristalle/i,
      /cristalli\s+della\s+genesi/i,
      /cristais\s+gênesis/i,
      /cristais\s+genesis/i,
      /cristal\s+génesis/i,
      /cristal\s+genesis/i,
      /cristaux\s+primaires/i,
      /창세의\s*결정/i,
    ],
  },
  {
    family: "oneiric-shard",
    chineseName: "古老夢華",
    patterns: [
      /古老夢華/i,
      /夢華/i,
      /往日の夢華/i,
      /oneiric\s+shard(?:s)?/i,
      /traumsplitter/i,
      /esquirla\s+onírica/i,
      /esquirla\s+onirica/i,
      /éclats?\s+oniriques?/i,
      /eclats?\s+oniriques?/i,
      /fragmento\s+onírico/i,
      /fragmento\s+onirico/i,
      /오래된\s*꿈/i,
    ],
  },
  {
    family: "pokemon-coin",
    chineseName: "寶可幣",
    patterns: [
      /寶可幣/i,
      /pok[eé]\s*coin(?:s)?/i,
      /pok[eé]\s*pi[èe]ce(?:s)?/i,
      /pok[eé]\s*piece(?:s)?/i,
      /pok[eé]\s*monete/i,
      /pok[eé]\s*m[üu]nzen/i,
      /pok[eé]\s*monedas/i,
      /ポケコイン/i,
    ],
  },
];

const EXACT_PRODUCT_TRANSLATIONS: Record<string, string> = {
  "event bonus": "活動獎勵",
  "event bonus giftable": "活動獎勵（可贈送）",
  "event ticket": "活動票券",
  ticket: "票券",
  "evergreen ticket 1": "常駐票券 1",
  "evergreen ticket 1 giftable": "常駐票券 1（可贈送）",
  "new trainer box": "新訓練家禮盒",
  "event pass deluxe": "活動豪華通行證",
  "event pass 3 deluxe": "活動豪華通行證 3",
  "event pass deluxe plus points": "活動豪華通行證 + 點數",
  "june 2 deluxe pass unlock": "6月2日豪華通行證解鎖",
};

const PHRASE_TRANSLATIONS: Array<[RegExp, string]> = [
  [/\blimited\s+time\b/gi, "限時"],
  [/\bnew\s+trainer\b/gi, "新訓練家"],
  [/\bgift\s+pack\b/gi, "禮包"],
  [/\bgiftable\b/gi, "可贈送"],
  [/\blive\b/gi, "現場"],
  [/\bevent\b/gi, "活動"],
  [/\bbonus\b/gi, "獎勵"],
  [/\bevergreen\b/gi, "常駐"],
  [/\bdeluxe\b/gi, "豪華"],
  [/\bpass\b/gi, "通行證"],
  [/\bticket\b/gi, "票券"],
  [/\bpackage\b/gi, "禮包"],
  [/\bpack\b/gi, "禮包"],
  [/\bbundle\b/gi, "組合包"],
  [/\bbox\b/gi, "禮盒"],
  [/\bpoints\b/gi, "點數"],
  [/\bpoint\b/gi, "點數"],
  [/\bunlock\b/gi, "解鎖"],
  [/\bredirect\b/gi, "導向"],
  [/\bmonthly\b/gi, "月卡"],
  [/\bsubscription\b/gi, "訂閱"],
  [/\bmonth\b/gi, "個月"],
];

const MONTH_TRANSLATIONS: Record<string, string> = {
  january: "1月",
  february: "2月",
  march: "3月",
  april: "4月",
  may: "5月",
  june: "6月",
  july: "7月",
  august: "8月",
  september: "9月",
  october: "10月",
  november: "11月",
  december: "12月",
};

export function normalizeIAPName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isChineseIAPName(name: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(name);
}

function hasPremiumCurrencyWord(name: string): boolean {
  return PREMIUM_CURRENCY_WORDS.some((pattern) => pattern.test(name));
}

function hasNonCurrencyNumberedWord(name: string): boolean {
  return NON_CURRENCY_NUMBERED_WORDS.some((pattern) => pattern.test(name));
}

function getCurrencyFamily(name: string): (typeof CURRENCY_FAMILY_PATTERNS)[number] | null {
  return CURRENCY_FAMILY_PATTERNS.find((entry) =>
    entry.patterns.some((pattern) => pattern.test(name))
  ) ?? null;
}

function extractNumericAmounts(name: string): string[] {
  return Array.from(name.matchAll(/\d+(?:[,.]\d+)?/g))
    .map((match) => match[0].replace(/[,.]/g, ""))
    .filter((value) => value.length > 0);
}

export function extractPremiumCurrencyQuantity(name: string): string | null {
  if (!hasPremiumCurrencyWord(name) || hasNonCurrencyNumberedWord(name)) return null;

  const matches = extractNumericAmounts(name);
  if (matches.length === 0) return null;

  const positiveNumbers = matches
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (positiveNumbers.length === 0) return null;
  return String(Math.max(...positiveNumbers));
}

export function extractLikelyCurrencyQuantity(name: string): string | null {
  if (hasNonCurrencyNumberedWord(name)) return null;

  const matches = extractNumericAmounts(name);
  if (matches.length !== 1) return null;

  const quantity = Number.parseInt(matches[0], 10);
  if (!Number.isFinite(quantity) || quantity < 10) return null;

  const withoutNumbers = name.replace(/\d+(?:[,.]\d+)?/g, "").replace(/[×x]/gi, "").trim();
  if (!/[A-Za-z\u00c0-\u024f\u0370-\u03ff\u0400-\u04ff\u1100-\u11ff\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(withoutNumbers)) {
    return null;
  }

  return String(quantity);
}

export function getIAPGroupKey(name: string): string {
  const quantity = extractPremiumCurrencyQuantity(name) ?? extractLikelyCurrencyQuantity(name);
  if (quantity) {
    const family = getCurrencyFamily(name)?.family ?? "generic";
    const modifier = getCurrencyOfferModifier(name);
    return `premium-currency:${family}:${modifier}:${quantity}`;
  }

  return `product:${normalizeIAPName(getIAPDisplayName(name))}`;
}

export function getIAPCanonicalDisplayName(name: string): string | null {
  if (hasNonCurrencyNumberedWord(name)) return null;

  const family = getCurrencyFamily(name);
  if (!family) return null;

  const quantity = extractPremiumCurrencyQuantity(name) ?? extractLikelyCurrencyQuantity(name);
  if (!quantity) return null;

  if (family.family === "delta-coin") {
    const bonusQuantity = extractBonusQuantity(name);
    return bonusQuantity
      ? `${formatQuantity(quantity)} ${family.chineseName} + ${formatQuantity(bonusQuantity)} 獎勵`
      : `${formatQuantity(quantity)} ${family.chineseName}`;
  }

  if (family.family === "pokemon-gold") {
    const modifier = getCurrencyOfferModifier(name);
    const prefix = modifier === "launch" ? "慶祝上線" : modifier === "discount" ? "優惠" : "";
    return `${formatQuantity(quantity)} ${prefix}${family.chineseName}`;
  }

  return `${formatQuantity(quantity)} ${family.chineseName}`;
}

export function getIAPDisplayName(name: string): string {
  const canonicalCurrencyName = getIAPCanonicalDisplayName(name);
  if (canonicalCurrencyName) return canonicalCurrencyName;

  const translatedName = translateGenericProductName(name);
  return translatedName ?? name;
}

function translateGenericProductName(name: string): string | null {
  const knownProductName = getKnownProductDisplayName(name);
  if (knownProductName) return knownProductName;

  if (isChineseIAPName(name)) return name;

  const normalized = normalizeIAPName(name);
  const exactTranslation = EXACT_PRODUCT_TRANSLATIONS[normalized];
  if (exactTranslation) return exactTranslation;

  let translated = name.trim();
  let changed = false;

  translated = translated.replace(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/gi,
    (month) => {
      changed = true;
      return MONTH_TRANSLATIONS[month.toLowerCase()] ?? month;
    }
  );

  for (const [pattern, replacement] of PHRASE_TRANSLATIONS) {
    translated = translated.replace(pattern, () => {
      changed = true;
      return replacement;
    });
  }

  if (!changed) return null;
  return cleanupTranslatedProductName(translated);
}

function getKnownProductDisplayName(name: string): string | null {
  const normalized = normalizeIAPName(name);
  const latinKey = normalizeLatinKey(name);

  if (/プレミアムパス/.test(name) || /프리미엄\s*패스/.test(name)) {
    return "特級護照";
  }

  if (isPokemonGoldAccessoryBundle(name)) {
    return "寶可金塊（付費） + 配件";
  }

  if (isPokemonGoldPromoCardBundle(name)) {
    return "寶可金塊（付費） + 宣傳卡";
  }

  const junePassMatch = normalized.match(/^june\s+(\d+)\s+deluxe\s+pass(?:\s+(?:unlock|redirect))?$/i);
  if (junePassMatch) return `6月${junePassMatch[1]}日豪華通行證`;

  const junePassPointsMatch = normalized.match(/^june\s+(\d+)\s+deluxe\s+(?:event\s+)?pass\s+(?:plus|\+)\s+points$/i);
  if (junePassPointsMatch) return `6月${junePassPointsMatch[1]}日豪華通行證 + 點數`;

  const loginSeasonMatch = normalized.match(/^7\s*-?\s*day\s*login\s*(?:rewards?|bonus|獎勵)\s*-\s*s(\d+)$/i);
  if (loginSeasonMatch) return `7日登入獎勵 S${loginSeasonMatch[1]}`;

  if (/^7\s*-?\s*day\s*login\s*(?:rewards?|bonus)$/i.test(normalized)) {
    return "7日登入獎勵";
  }

  if (/^recompensas\s+de\s+7\s+d[ií]as$/i.test(normalized)) {
    return "7日登入獎勵";
  }

  const aliases: Record<string, string> = {
    "black hawk down - reshape": "黑鷹墜落-重塑",
    "echo season pack": "回聲賽季禮包",
    "echo supplies": "回聲補給",
    "echo supplies - advanced": "回聲補給-進階",
    "edicao especial - eco": "回聲特供",
    "edicao especial echo": "回聲特供",
    "edicion especial - eco": "回聲特供",
    "edicion especial echo": "回聲特供",
    "limited time special offer": "限時特惠組合包",
    "meltdown supplies": "熔毀補給",
    "meltdown supplies - advanced": "熔毀補給-進階",
    "pase premium": "特級護照",
    "pass premium": "特級護照",
    "passe premium": "特級護照",
    "premium pass": "特級護照",
    "premiumpass": "特級護照",
    "silent sentinel supplies": "靜默哨兵補給",
    "sentinela silencioso": "靜默哨兵補給",
    "centinela silencioso": "靜默哨兵補給",
    "suministros - eco": "回聲補給",
    "suministros avanzados - eco": "回聲補給-進階",
    "suprimentos echo": "回聲補給",
    "suprimentos echo - avancado": "回聲補給-進階",
    "tide supplies": "潮汐補給",
    "tide supplies - advanced": "潮汐補給-進階",
  };

  return aliases[latinKey] ?? null;
}

function normalizeLatinKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isPokemonGoldAccessoryBundle(name: string): boolean {
  const normalized = normalizeLatinKey(name);
  const hasPokemonGold =
    /poke\s*gold/.test(normalized) ||
    /pokeouro/.test(normalized) ||
    /poke\s*ouro/.test(normalized) ||
    /pokeling/.test(normalized) ||
    /寶可金塊/.test(name) ||
    /ポケゴールド/.test(name) ||
    /포켓골드/.test(name);
  const hasAccessories = /accessor/.test(normalized) || /acessorios/.test(normalized) || /配件/.test(name);

  return hasPokemonGold && hasAccessories;
}

function isPokemonGoldPromoCardBundle(name: string): boolean {
  const normalized = normalizeLatinKey(name);
  const hasPokemonGold =
    /poke\s*gold/.test(normalized) ||
    /pokeouro/.test(normalized) ||
    /poke\s*ouro/.test(normalized) ||
    /pokeling/.test(normalized) ||
    /寶可金塊/.test(name) ||
    /ポケゴールド/.test(name) ||
    /포켓골드/.test(name);
  const hasPromoCard = /promo\s*card/.test(normalized) || /宣傳卡/.test(name);

  return hasPokemonGold && hasPromoCard;
}

function cleanupTranslatedProductName(name: string): string {
  return name
    .replace(/\s*\+\s*/g, " + ")
    .replace(/(\d+)月\s+(\d+)/g, "$1月$2日")
    .replace(/\s+([A-Z]\d+)$/i, " $1")
    .replace(/\s+/g, "")
    .replace(/\+/g, " + ")
    .replace(/([A-Z]\d+)$/i, " $1")
    .replace(/([\u4e00-\u9fff])(\d+)$/g, "$1 $2")
    .trim();
}

function formatQuantity(quantity: string): string {
  return Number.parseInt(quantity, 10).toLocaleString("en-US");
}

function extractBonusQuantity(name: string): string | null {
  const match = name.match(/\+\s*(\d+(?:[,.]\d+)?)\s*(?:bonus|獎勵)?/i);
  return match?.[1]?.replace(/[,.]/g, "") ?? null;
}

function getCurrencyOfferModifier(name: string): string {
  const normalized = normalizeLatinKey(name);

  if (
    /release|launch|lancio|lanc\.|veroff|veroff\.|rebaja|慶祝|上線|リリース|記念|출시|pocket:/.test(normalized) ||
    /慶祝|上線|リリース|記念|출시/.test(name)
  ) {
    return "launch";
  }

  if (/discount|deal|promo|sale|offerta|oferta|solde|優惠|特惠/.test(normalized) || /優惠|特惠/.test(name)) {
    return "discount";
  }

  return "normal";
}

function getLeadingNumber(name: string): number | null {
  const match = name.match(/^\s*(\d[\d,]*)/);
  if (!match) return null;
  const value = Number.parseInt(match[1].replace(/,/g, ""), 10);
  return Number.isFinite(value) ? value : null;
}

function getLeadingNumberUnit(name: string): string | null {
  const match = name.match(/^\s*\d[\d,]*\s*([^\d+]+)/);
  return match?.[1]?.trim() ?? null;
}

export function compareIAPDisplayNames(a: string, b: string): number {
  const aUnit = getLeadingNumberUnit(a);
  const bUnit = getLeadingNumberUnit(b);

  if (aUnit && bUnit && aUnit === bUnit) {
    const aNumber = getLeadingNumber(a);
    const bNumber = getLeadingNumber(b);
    if (aNumber !== null && bNumber !== null && aNumber !== bNumber) {
      return aNumber - bNumber;
    }
  }

  return a.replace(/,/g, "").localeCompare(b.replace(/,/g, ""), "zh-Hant", {
    sensitivity: "base",
    numeric: false,
  });
}

export function getIAPDisplayPriority(name: string, countryCode: string): number {
  if (countryCode === "tw") return 0;
  if (countryCode === "hk") return 1;
  if (isChineseIAPName(name)) return 2;
  return 3;
}
