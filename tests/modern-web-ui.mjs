import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { chromium, webkit } from "playwright-core";
import { createWebsiteApp } from "../src/app.mjs";

for (const engine of [chromium, webkit]) {
  test(`${engine.name()}: real website navigation and text preferences`, { timeout: 90_000 }, async t => {
    const app = createWebsiteApp({ publicDir: new URL("../public", import.meta.url).pathname });
    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");
    t.after(() => app.close());
    const browser = await engine.launch();
    t.after(() => browser.close());
    const base = `http://127.0.0.1:${app.server.address().port}`;
    for (const locale of ["en", "zh-cn"]) {
      await t.test(`${locale}: mobile navigation closes with Escape and outside click`, async () => {
        const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
        await page.goto(`${base}/${locale}/`);
        const trigger = page.locator("[data-menu-toggle]");
        const menu = page.locator("#primary-nav");
        await trigger.focus();
        await trigger.press("Enter");
        // WebKit follows macOS: Option-Tab includes links in keyboard navigation.
        await page.keyboard.press(engine.name() === "webkit" ? "Alt+Tab" : "Tab");
        assert.equal(await menu.locator("a").first().evaluate(el => el === document.activeElement), true, "Tab enters the open navigation");
        await page.keyboard.press("Escape");
        assert.equal(await menu.isVisible(), false, "Escape closes navigation");
        assert.equal(await trigger.evaluate(el => el === document.activeElement), true, "focus returns to trigger");
        await trigger.click();
        await page.mouse.click(8, 600);
        assert.equal(await menu.isVisible(), false, "outside click closes navigation");
        await trigger.click();
        await menu.locator("a").first().focus();
        await page.setViewportSize({ width: 390, height: 667 });
        assert.equal(await menu.isVisible(), true, "a narrow resize preserves open navigation");
        await page.waitForFunction(() => document.querySelector("#primary-nav a") === document.activeElement);
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.waitForFunction(() => document.querySelector(".site-header").dataset.navLayout === "wide");
        assert.equal(await menu.isVisible(), true, "wide navigation stays inline");
        assert.equal(await trigger.isVisible(), false);
        await page.setViewportSize({ width: 375, height: 667 });
        await menu.waitFor({ state: "hidden" });
        assert.equal(await menu.isVisible(), false, "collapsing starts with a closed navigation");
        assert.deepEqual(errors, []);
        await page.close();
      });
    }
    await t.test("compact navigation fits small screens and larger text", async () => {
      const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
      await page.goto(`${base}/en/`);
      await page.evaluate(() => document.documentElement.style.fontSize = "24px");
      await page.locator("[data-menu-toggle]").click();
      const bounds = await page.locator(".site-header").evaluate(header => ({
        width: document.documentElement.scrollWidth,
        viewport: innerWidth,
        bottom: header.getBoundingClientRect().bottom,
        menuTop: document.querySelector("#primary-nav").getBoundingClientRect().top,
      }));
      assert.ok(bounds.width <= bounds.viewport, JSON.stringify(bounds));
      assert.ok(bounds.menuTop >= bounds.bottom, JSON.stringify(bounds));
      await page.close();
    });
    await t.test("navigation remains usable without native popover", async () => {
      const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
      await page.addInitScript(() => { delete HTMLElement.prototype.popover; });
      await page.goto(`${base}/en/`);
      const trigger = page.locator("[data-menu-toggle]");
      const menu = page.locator("#primary-nav");
      await trigger.focus();
      await trigger.press("Enter");
      assert.equal(await menu.isVisible(), true);
      assert.equal(await menu.locator("a").first().evaluate(el => el === document.activeElement), true);
      await page.keyboard.press("Escape");
      assert.equal(await menu.isVisible(), false);
      assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
      await trigger.click();
      await page.mouse.click(8, 600);
      assert.equal(await menu.isVisible(), false);
      await page.close();
    });
    await t.test("hidden mobile documentation cannot receive keyboard focus", async () => {
      const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
      await page.goto(`${base}/docs/quickstart/`);
      const search = page.locator("#docs-search-input");
      await search.evaluate(el => el.focus());
      assert.equal(await search.evaluate(el => el === document.activeElement), false, "closed sidebar must not accept focus offscreen");
      await page.locator("[data-docs-menu]").click();
      await search.focus();
      assert.equal(await search.evaluate(el => el === document.activeElement), true);
      for (const composition of [{ isComposing: true }, { keyCode: 229 }]) {
        await search.dispatchEvent("keydown", { key: "Escape", bubbles: true, ...composition });
        assert.equal(await search.isVisible(), true, "IME cancellation keeps the documentation search open");
      }
      await page.keyboard.press("Escape");
      assert.equal(await search.isVisible(), false);
      assert.equal(await page.locator("[data-docs-menu]").evaluate(el => el === document.activeElement), true);
      await page.setViewportSize({ width: 1440, height: 900 });
      assert.equal(await search.isVisible(), true);
      await page.close();
    });
    await t.test("body follows the user's enlarged default text size", async () => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${base}/en/`);
      await page.evaluate(() => document.documentElement.style.fontSize = "24px");
      assert.equal(await page.locator("body").evaluate(el => getComputedStyle(el).fontSize), "24px");
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.close();
    });
  });
}
