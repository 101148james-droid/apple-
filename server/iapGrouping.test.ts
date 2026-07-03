import { describe, expect, it } from "vitest";
import {
  getIAPCanonicalDisplayName,
  compareIAPDisplayNames,
  getIAPDisplayName,
  getIAPDisplayPriority,
  getIAPGroupKey,
} from "@shared/iapGrouping";

const buy6MagicStones = "\u8cfc\u8cb7 6 \u7c92\u9b54\u6cd5\u77f3";
const buy1MagicStone = "\u8cfc\u8cb7 1 \u7c92\u9b54\u6cd5\u77f3";
const buy150MagicStones = "\u8cfc\u8cb7 150 \u7c92\u9b54\u6cd5\u77f3";
const oldDreams6480 = "6480\u679a\u53e4\u8001\u5922\u83ef";

describe("IAP grouping", () => {
  it("groups localized premium currency items by quantity", () => {
    expect(getIAPGroupKey(buy6MagicStones)).toBe(getIAPGroupKey("6 Diamonds"));
    expect(getIAPGroupKey(buy1MagicStone)).toBe(getIAPGroupKey("1 Diamond"));
    expect(getIAPGroupKey(buy150MagicStones)).toBe(getIAPGroupKey("150 Diamonds"));
  });

  it("does not group numbered passes as premium currency", () => {
    expect(getIAPGroupKey("TOS Battle Pass (1)")).not.toBe(getIAPGroupKey("1 Diamond"));
  });

  it("groups Honkai localized currency names by quantity", () => {
    expect(getIAPGroupKey(oldDreams6480)).toBe(getIAPGroupKey("6480 Oneiric Shards"));
  });

  it("groups translated single-quantity currency names without hardcoding every language", () => {
    expect(getIAPGroupKey("6480 Sch\u00f6pfungskristalle")).toBe(getIAPGroupKey("6480 Genesis Crystals"));
    expect(getIAPGroupKey("Cristal g\u00e9nesis \u00d760")).toBe(getIAPGroupKey("60 Genesis Crystals"));
    expect(getIAPGroupKey("\ucc3d\uc138\uc758 \uacb0\uc815x300")).toBe(getIAPGroupKey("300 Genesis Crystals"));
    expect(getIAPGroupKey("Traumsplitter x6.480")).toBe(getIAPGroupKey("6480 Oneiric Shards"));
    expect(getIAPGroupKey("\u00c9clats oniriques \u00d7 300")).toBe(getIAPGroupKey("300 Oneiric Shards"));
  });

  it("groups localized Pokemon GO coin names by quantity", () => {
    expect(getIAPGroupKey("100 Pok\u00e9Pieces")).toBe(getIAPGroupKey("100 Pok\u00e9Coins"));
    expect(getIAPGroupKey("550 Pok\u00e9Pi\u00e8ces")).toBe(getIAPGroupKey("550 Pok\u00e9Coins"));
    expect(getIAPGroupKey("100 Pok\u00e9monete")).toBe(getIAPGroupKey("100 Pok\u00e9Coins"));
    expect(getIAPGroupKey("100 Pok\u00e9M\u00fcnzen")).toBe(getIAPGroupKey("100 Pok\u00e9Coins"));
    expect(getIAPGroupKey("100 Pok\u00e9monedas")).toBe(getIAPGroupKey("100 Pok\u00e9Coins"));
    expect(getIAPGroupKey("100 \u30dd\u30b1\u30b3\u30a4\u30f3")).toBe(getIAPGroupKey("100 Pok\u00e9Coins"));
  });

  it("groups paid currency products even when the quantity is below 10", () => {
    expect(getIAPGroupKey("\u5bf6\u53ef\u91d1\u584a\uff08\u4ed8\u8cbb\uff09x5")).toBe(getIAPGroupKey("Pok\u00e9 Gold (paid) \u00d75"));
    expect(getIAPGroupKey("\ud3ec\ucf13\uace8\ub4dc(\uc720\ub8cc)\u00d75")).toBe(getIAPGroupKey("Pok\u00e9 Gold (paid) \u00d75"));
    expect(getIAPGroupKey("5 Pok\u00e9lingotes (de pago)")).toBe(getIAPGroupKey("Pok\u00e9 Gold (paid) \u00d75"));
    expect(getIAPDisplayName("Pok\u00e9 Gold (paid) \u00d75")).toBe("5 \u5bf6\u53ef\u91d1\u584a\uff08\u4ed8\u8cbb\uff09");
  });

  it("keeps launch-discount paid currency products separate from normal paid currency", () => {
    expect(getIAPGroupKey("\u6176\u795d\u904a\u6232\u4e0a\u7dda\u3000\u8d85\u503c\u5bf6\u53ef\u91d1\u584a\uff08\u4ed8\u8cbb\uff09x5")).toBe(getIAPGroupKey("Release Pok\u00e9 Gold (paid) x5"));
    expect(getIAPGroupKey("\u30ea\u30ea\u30fc\u30b9\u8a18\u5ff5\u3000\u304a\u5f97\u306a\u30dd\u30b1\u30b4\u30fc\u30eb\u30c9(\u6709\u511f)\u00d75")).toBe(getIAPGroupKey("Release Pok\u00e9 Gold (paid) x5"));
    expect(getIAPGroupKey("Pok\u00e9ling. lancio (pagam.) \u00d75")).toBe(getIAPGroupKey("Release Pok\u00e9 Gold (paid) x5"));
    expect(getIAPGroupKey("Pok\u00e9 Gold (paid) \u00d75")).not.toBe(getIAPGroupKey("Release Pok\u00e9 Gold (paid) x5"));
    expect(getIAPDisplayName("Release Pok\u00e9 Gold (paid) x5")).toBe("5 \u6176\u795d\u4e0a\u7dda\u5bf6\u53ef\u91d1\u584a\uff08\u4ed8\u8cbb\uff09");
  });

  it("normalizes common premium pass names to the Chinese store name", () => {
    expect(getIAPGroupKey("Premium Pass")).toBe(getIAPGroupKey("\u7279\u7d1a\u8b77\u7167"));
    expect(getIAPGroupKey("Pass premium")).toBe(getIAPGroupKey("\u7279\u7d1a\u8b77\u7167"));
    expect(getIAPGroupKey("Pase pr\u00e9mium")).toBe(getIAPGroupKey("\u7279\u7d1a\u8b77\u7167"));
    expect(getIAPGroupKey("\ud504\ub9ac\ubbf8\uc5c4 \ud328\uc2a4")).toBe(getIAPGroupKey("\u7279\u7d1a\u8b77\u7167"));
    expect(getIAPGroupKey("\u30d7\u30ec\u30df\u30a2\u30e0\u30d1\u30b9")).toBe(getIAPGroupKey("\u7279\u7d1a\u8b77\u7167"));
    expect(getIAPDisplayName("Premium Pass")).toBe("\u7279\u7d1a\u8b77\u7167");
  });

  it("uses Chinese names for paid currency accessory bundles", () => {
    expect(getIAPGroupKey("Pok\u00e9 Gold (paid) + Accessories")).toBe(getIAPGroupKey("Pok\u00e9ouro (Pago) + Acess\u00f3rios"));
    expect(getIAPDisplayName("Pok\u00e9 Gold (paid) + Accessories")).toBe("\u5bf6\u53ef\u91d1\u584a\uff08\u4ed8\u8cbb\uff09 + \u914d\u4ef6");
    expect(getIAPDisplayName("Pok\u00e9 Gold (paid) + Promo Card")).toBe("\u5bf6\u53ef\u91d1\u584a\uff08\u4ed8\u8cbb\uff09 + \u5ba3\u50b3\u5361");
  });

  it("uses Chinese canonical names for known translated currency products", () => {
    expect(getIAPCanonicalDisplayName("6 Diamonds")).toBe("6 \u9b54\u6cd5\u77f3");
    expect(getIAPCanonicalDisplayName(buy6MagicStones)).toBe("6 \u9b54\u6cd5\u77f3");
    expect(getIAPCanonicalDisplayName("168 Prisms")).toBe("168 \u7a1c\u93e1");
    expect(getIAPCanonicalDisplayName("100 Pok\u00e9Pi\u00e8ces")).toBe("100 \u5bf6\u53ef\u5e63");
    expect(getIAPCanonicalDisplayName("550 Pok\u00e9Coins")).toBe("550 \u5bf6\u53ef\u5e63");
    expect(getIAPCanonicalDisplayName("6480 Sch\u00f6pfungskristalle")).toBe("6,480 \u5275\u4e16\u7d50\u6676");
    expect(getIAPCanonicalDisplayName("Cristal g\u00e9nesis \u00d760")).toBe("60 \u5275\u4e16\u7d50\u6676");
    expect(getIAPCanonicalDisplayName("Traumsplitter x6.480")).toBe("6,480 \u53e4\u8001\u5922\u83ef");
    expect(getIAPCanonicalDisplayName("\u00c9clats oniriques \u00d7 300")).toBe("300 \u53e4\u8001\u5922\u83ef");
  });

  it("uses Chinese display names for common ticket, pass, and pack products", () => {
    expect(getIAPDisplayName("Event Bonus")).toBe("\u6d3b\u52d5\u734e\u52f5");
    expect(getIAPDisplayName("Event Bonus Giftable")).toBe("\u6d3b\u52d5\u734e\u52f5\uff08\u53ef\u8d08\u9001\uff09");
    expect(getIAPDisplayName("Event Ticket")).toBe("\u6d3b\u52d5\u7968\u5238");
    expect(getIAPDisplayName("Ticket")).toBe("\u7968\u5238");
    expect(getIAPDisplayName("Evergreen Ticket 1")).toBe("\u5e38\u99d0\u7968\u5238 1");
    expect(getIAPDisplayName("Evergreen Ticket 1 Giftable")).toBe("\u5e38\u99d0\u7968\u5238 1\uff08\u53ef\u8d08\u9001\uff09");
    expect(getIAPDisplayName("New Trainer Box")).toBe("\u65b0\u8a13\u7df4\u5bb6\u79ae\u76d2");
    expect(getIAPDisplayName("June 2 Deluxe Pass Unlock")).toBe("6\u67082\u65e5\u8c6a\u83ef\u901a\u884c\u8b49");
    expect(getIAPDisplayName("June 3 Deluxe Pass Redirect")).toBe("6\u67083\u65e5\u8c6a\u83ef\u901a\u884c\u8b49");
    expect(getIAPDisplayName("June 4 Deluxe Event Pass + Points")).toBe("6\u67084\u65e5\u8c6a\u83ef\u901a\u884c\u8b49 + \u9ede\u6578");
    expect(getIAPDisplayName("Event Pass Deluxe Plus Points")).toBe("\u6d3b\u52d5\u8c6a\u83ef\u901a\u884c\u8b49 + \u9ede\u6578");
    expect(getIAPDisplayName("Live Event Ticket")).toBe("\u73fe\u5834\u6d3b\u52d5\u7968\u5238");
    expect(getIAPDisplayName("Limited Time Gift Pack A1")).toBe("\u9650\u6642\u79ae\u5305 A1");
  });

  it("groups common translated product names by their Chinese display name", () => {
    expect(getIAPGroupKey("Event Ticket")).toBe(getIAPGroupKey("\u6d3b\u52d5\u7968\u5238"));
    expect(getIAPGroupKey("Ticket")).toBe(getIAPGroupKey("\u7968\u5238"));
    expect(getIAPGroupKey("Evergreen Ticket 1")).toBe(getIAPGroupKey("\u5e38\u99d0\u7968\u5238 1"));
    expect(getIAPGroupKey("Limited Time Gift Pack A1")).toBe(getIAPGroupKey("\u9650\u6642\u79ae\u5305 A1"));
    expect(getIAPGroupKey("June 3 Deluxe Pass Redirect")).toBe(getIAPGroupKey("June 3 Deluxe Pass Unlock"));
    expect(getIAPGroupKey("June 4 Deluxe Pass Redirect")).toBe(getIAPGroupKey("June 4 Deluxe Pass Unlock"));
  });

  it("normalizes Garena Delta Force product names across common store languages", () => {
    expect(getIAPDisplayName("680 Delta Coins + 70 Bonus")).toBe("680 \u4e09\u89d2\u6d32\u5e63 + 70 \u734e\u52f5");
    expect(getIAPGroupKey("7 day login rewards")).toBe(getIAPGroupKey("7-Day Login Rewards"));
    expect(getIAPGroupKey("Recompensas de 7 d\u00edas")).toBe(getIAPGroupKey("7-Day Login Rewards"));
    expect(getIAPGroupKey("7 Day login Bonus - S5")).toBe(getIAPGroupKey("7Daylogin\u734e\u52f5- S5"));
    expect(getIAPDisplayName("Echo Supplies - Advanced")).toBe("\u56de\u8072\u88dc\u7d66-\u9032\u968e");
    expect(getIAPGroupKey("Echo Supplies - Advanced")).toBe(getIAPGroupKey("Suministros avanzados - Eco"));
    expect(getIAPGroupKey("Echo Supplies - Advanced")).toBe(getIAPGroupKey("Suprimentos Echo - Avan\u00e7ado"));
    expect(getIAPGroupKey("Edi\u00e7\u00e3o especial - Eco")).toBe(getIAPGroupKey("Edi\u00e7\u00e3o Especial Echo"));
    expect(getIAPDisplayName("Tide Supplies")).toBe("\u6f6e\u6c50\u88dc\u7d66");
    expect(getIAPDisplayName("Meltdown Supplies - Advanced")).toBe("\u7194\u6bc0\u88dc\u7d66-\u9032\u968e");
    expect(getIAPDisplayName("Silent Sentinel Supplies")).toBe("\u975c\u9ed8\u54e8\u5175\u88dc\u7d66");
  });

  it("sorts comparison rows by product name with numeric ordering", () => {
    const names = ["5,200 \u5bf6\u53ef\u5e63", "100 \u5bf6\u53ef\u5e63", "1,200 \u5bf6\u53ef\u5e63", "6\u67083\u65e5\u8c6a\u83ef\u901a\u884c\u8b49"];

    expect([...names].sort(compareIAPDisplayNames)).toEqual([
      "100 \u5bf6\u53ef\u5e63",
      "1,200 \u5bf6\u53ef\u5e63",
      "5,200 \u5bf6\u53ef\u5e63",
      "6\u67083\u65e5\u8c6a\u83ef\u901a\u884c\u8b49",
    ]);
  });

  it("does not group numbered non-currency products by quantity", () => {
    expect(getIAPGroupKey("Evergreen Ticket 1")).not.toBe(getIAPGroupKey("1 Diamond"));
    expect(getIAPGroupKey("PUBGM Prime(1 month)")).not.toBe(getIAPGroupKey("1 Diamond"));
    expect(getIAPGroupKey("Level 100 Pack")).not.toBe(getIAPGroupKey("100 Pok\u00e9Coins"));
    expect(getIAPGroupKey("VIP 10")).not.toBe(getIAPGroupKey("10 Genesis Crystals"));
  });

  it("prefers Taiwan names, then Hong Kong names, then other Chinese names", () => {
    expect(getIAPDisplayPriority(buy6MagicStones, "tw")).toBe(0);
    expect(getIAPDisplayPriority(buy6MagicStones, "hk")).toBe(1);
    expect(getIAPDisplayPriority(buy6MagicStones, "br")).toBe(2);
    expect(getIAPDisplayPriority("6 Diamonds", "us")).toBe(3);
  });
});
