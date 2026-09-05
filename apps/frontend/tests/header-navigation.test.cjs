const assert = require("node:assert/strict");
const { before, after, beforeEach, afterEach, test } = require("node:test");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.TEST_BASE_URL || "http://127.0.0.1:5173";
let browser;
let context;
let page;

before(async () => {
  browser = await chromium.launch({
    executablePath: process.env.TEST_BROWSER_EXECUTABLE,
    headless: true,
  });
});
after(async () => browser?.close());
beforeEach(async () => {
  context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  page = await context.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("bepdi6_access_token", "navigation-test-only");
    localStorage.setItem(
      "bepdi6_cart_items",
      JSON.stringify([
        {
          id: "test-item",
          product_id: 1,
          product_name: "Test",
          unit_price: 30000,
          quantity: 1,
          options: [],
        },
      ]),
    );
  });
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/api/v1/")) {
      const endpoint = url.pathname.split("/api/v1/")[1].replace(/\/$/, "");
      let data = [];
      if (endpoint === "customers/me")
        data = { id: 1, name: "Test", phone: "0900000000" };
      if (endpoint === "shop/info") data = { name: "Test", is_open: true };
      if (endpoint === "checkout/preview")
        data = {
          subtotal: 30000,
          shipping_fee: 0,
          discount: 0,
          total_amount: 30000,
          is_valid: true,
          can_checkout: true,
        };
      return route.fulfill({ json: { success: true, data } });
    }
    if (url.origin === new URL(baseURL).origin) return route.continue();
    return route.abort();
  });
});
afterEach(async () => context?.close());

async function tapBack() {
  const arrow = page.locator(".header-margin button");
  const hit = await arrow.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const target = document.elementFromPoint(
      rect.x + rect.width / 2,
      rect.y + rect.height / 2,
    );
    return {
      disabled: el.disabled,
      receivesPointer: el === target || el.contains(target),
    };
  });
  assert.deepEqual(hit, { disabled: false, receivesPointer: true });
  await arrow.tap();
}

for (const path of ["/checkout", "/select-location"]) {
  test(`Back has a home fallback when ${path} is the only history entry`, async () => {
    await page.goto(`${baseURL}${path}`);
    await page.locator(".header-margin button").waitFor();
    // Model a fresh embedded webview/deep link, without an about:blank predecessor.
    const cdp = await context.newCDPSession(page);
    await cdp.send("Page.resetNavigationHistory");
    assert.equal(await page.evaluate(() => history.length), 1);
    await tapBack();
    await page.waitForURL(`${baseURL}/`, { timeout: 3000 });
    assert.equal(
      await page.evaluate(() => history.length),
      1,
      "Fallback replaces the entry to avoid a Back loop",
    );
  });
}

test("Back preserves navigation to the previous page instead of always going home", async () => {
  await page.goto(`${baseURL}/order`);
  await page.getByRole("button", { name: "Giỏ hàng", exact: true }).tap();
  await page.waitForURL(`${baseURL}/checkout`);
  await tapBack();
  await page.waitForURL(`${baseURL}/order`);
});

test("Reloading checkout retains a valid in-app Back destination", async () => {
  await page.goto(`${baseURL}/`);
  await page.getByRole("button", { name: "Giỏ hàng", exact: true }).tap();
  await page.waitForURL(`${baseURL}/checkout`);
  await page.reload();
  await tapBack();
  await page.waitForURL(`${baseURL}/`);
});
