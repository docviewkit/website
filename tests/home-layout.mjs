// Run with: npm run test:browsers
import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { chromium, firefox, webkit } from "playwright-core";
import { mkdir, readFile } from "node:fs/promises";
import { createWebsiteApp } from "../src/app.mjs";

for (const name of (process.env.BROWSERS || "chromium,firefox,webkit").split(",")) {
test(`${name}: localized home and real npm Demo work without browser errors`, async () => {
  const app = createWebsiteApp({ publicDir: new URL("../public", import.meta.url).pathname });
  let browser;
  try {
    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");
    browser = await ({ chromium, firefox, webkit })[name].launch({ headless: true });
    for (const locale of ["en", "zh-cn"]) {
      for (const width of [1440, 375]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 } });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
        await page.goto(`http://127.0.0.1:${app.server.address().port}/${locale}/`, { waitUntil: "networkidle" });
        await page.locator("#formats").scrollIntoViewIfNeeded();
        assert.equal(await page.locator("#formats article").count(), 7);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale} at ${width}px`);
        assert.deepEqual(errors, []);
        await page.close();
      }
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      await page.goto(`http://127.0.0.1:${app.server.address().port}/${locale}/demo/`);
      await page.waitForFunction(() => /^(?:Document ready\.|文档已就绪。)$/u.test(document.querySelector("#demo-status")?.textContent), undefined, { timeout: 60000 });
      assert.equal(await page.locator("#demo-format").textContent(), "PPTX");
      const sdk = JSON.parse(await readFile(new URL("../node_modules/@docviewkit/viewer/package.json", import.meta.url), "utf8"));
      assert.equal(await page.evaluate(() => customElements.get("docviewkit-viewer") !== undefined), true);
      const version = await page.request.get(`http://127.0.0.1:${app.server.address().port}/sdk/version.json`);
      assert.equal((await version.json()).version, sdk.version);
      const canvas = page.locator("docviewkit-viewer canvas:visible").first();
      await canvas.waitFor();
      assert.ok(await canvas.evaluate((canvas) => canvas.width > 0 && canvas.height > 0));
      assert.ok(await canvas.evaluate((canvas) => {
        const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
        let painted = 0;
        for (let index = 0; index < pixels.length; index += 4) {
          if (pixels[index + 3] > 0 && Math.min(pixels[index], pixels[index + 1], pixels[index + 2]) < 240 && ++painted > 100) return true;
        }
        return false;
      }), "real PPTX page must paint content");
      assert.deepEqual(errors, []);
      if (process.env.CI && locale === "zh-cn") {
        await mkdir(new URL("../release-output/browser-proof/", import.meta.url), { recursive: true });
        await page.screenshot({ path: new URL(`../release-output/browser-proof/${name}.png`, import.meta.url).pathname });
      }
      await page.close();
    }
  } finally {
    await browser?.close();
    await app.close();
  }
});
}
