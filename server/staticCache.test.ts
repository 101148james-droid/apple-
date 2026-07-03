import { describe, expect, it } from "vitest";
import { getStaticCacheControl } from "./_core/vite";

describe("static cache headers", () => {
  it("prevents index.html from holding an old asset manifest", () => {
    expect(getStaticCacheControl("/var/www/appstore-price-compare/dist/public/index.html")).toBe("no-store");
  });

  it("allows hashed assets to be cached immutably", () => {
    expect(getStaticCacheControl("/var/www/appstore-price-compare/dist/public/assets/index-abc123.js")).toBe(
      "public, max-age=31536000, immutable"
    );
  });
});
