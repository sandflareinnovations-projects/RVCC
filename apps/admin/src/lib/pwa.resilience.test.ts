import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("QA Scenario 4: PWA Offline Resilience, Service Worker Caching & Security Audit", () => {
  const rootDir = path.resolve(__dirname, "../../../..");

  const apps = [
    { name: "admin", dir: path.join(rootDir, "apps/admin") },
    { name: "procurement", dir: path.join(rootDir, "apps/procurement") },
    { name: "vendor", dir: path.join(rootDir, "apps/vendor") },
    { name: "web", dir: path.join(rootDir, "apps/web") },
  ];

  it("Step 1: Verify each application has a valid offline.html shell fallback", () => {
    for (const app of apps) {
      const offlinePath = path.join(app.dir, "public/offline.html");
      expect(fs.existsSync(offlinePath), `${app.name} is missing public/offline.html`).toBe(true);

      const html = fs.readFileSync(offlinePath, "utf-8");
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toMatch(/offline/i);
      expect(html).toContain("theme-color");
      expect(html.length).toBeGreaterThan(500); // Ensures rich styled fallback rather than blank page
    }
  });

  it("Step 2: Verify Service Worker precaches offline.html and has skipWaiting lifecycle", () => {
    for (const app of apps) {
      const swPath = path.join(app.dir, "public/sw.js");
      expect(fs.existsSync(swPath), `${app.name} is missing public/sw.js`).toBe(true);

      const swContent = fs.readFileSync(swPath, "utf-8");

      // Verify offline.html is in PRECACHE_URLS
      expect(swContent).toMatch(/PRECACHE_URLS[\s\S]*?['"]\/offline\.html['"]/);

      // Verify automatic update pickup
      expect(swContent).toContain("skipWaiting()");
      expect(swContent).toContain("clients.claim()");
    }
  });

  it("Step 3: Verify Confidential API endpoints (/api/*) are strictly NETWORK-ONLY in Service Workers", () => {
    for (const app of apps) {
      const swPath = path.join(app.dir, "public/sw.js");
      const swContent = fs.readFileSync(swPath, "utf-8");

      // API requests must never be stored in CacheStorage
      expect(swContent).toMatch(/url\.pathname\.startsWith\(['"]\/api\/['"]\)/);
      expect(swContent).toMatch(/return;\s*\/\/\s*Let (the )?browser handle/i);
    }
  });

  it("Step 4: Verify PWA Manifest & App Icons Configuration", () => {
    for (const app of apps) {
      // Must either have static manifest.json, manifest.webmanifest, or dynamic Next.js manifest.ts
      const hasStaticManifest =
        fs.existsSync(path.join(app.dir, "public/manifest.json")) ||
        fs.existsSync(path.join(app.dir, "public/manifest.webmanifest"));
      const hasDynamicManifest = fs.existsSync(path.join(app.dir, "src/app/manifest.ts"));

      expect(
        hasStaticManifest || hasDynamicManifest,
        `${app.name} missing both manifest.json and manifest.ts`
      ).toBe(true);

      // Verify icon directory exists and contains standard sizes
      const iconDir = path.join(app.dir, "public/icons");
      expect(fs.existsSync(iconDir), `${app.name} missing public/icons`).toBe(true);

      const iconFiles = fs.readdirSync(iconDir);
      const has192 = iconFiles.some((f) => f.includes("192"));
      const has512 = iconFiles.some((f) => f.includes("512"));

      expect(has192, `${app.name} missing 192x192 icon`).toBe(true);
      expect(has512, `${app.name} missing 512x512 icon`).toBe(true);
    }
  });

  it("Step 5: Verify Cache Busting & Fresh Build Identification across apps", () => {
    for (const app of apps) {
      const swPath = path.join(app.dir, "public/sw.js");
      const swContent = fs.readFileSync(swPath, "utf-8");

      // Verify CACHE_VERSION exists and scopes caches
      expect(swContent).toMatch(/const CACHE_VERSION\s*=\s*['"][a-zA-Z0-9_-]+['"]/);
      expect(swContent).toContain("SHELL_CACHE");
      expect(swContent).toContain("RUNTIME_CACHE");
    }
  });
});
