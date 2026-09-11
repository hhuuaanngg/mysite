import { expect, test } from "@playwright/test";

test("首页三个交互区块完成加载后仍然可见", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  for (const component of ["SiteHeader", "Showcase", "Contact"]) {
    const island = page.locator(`astro-island[component-export="${component}"]:not([ssr])`);
    await island.waitFor();
    await expect(island.locator("header, section").first()).toBeVisible();
  }
  await expect(page.getByRole("tab", { name: "作品", exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "文章", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "社交媒体", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("作品和文章切换后分别保留页码与当前内容", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator('astro-island[component-export="Showcase"]:not([ssr])').waitFor();
  const work = page.getByRole("tabpanel", { name: "作品", exact: true });
  const articles = page.getByRole("tabpanel", { name: "文章", exact: true });
  await work.getByRole("button", { name: "2", exact: true }).click();
  await expect(work.getByRole("button", { name: "2", exact: true })).toHaveAttribute("aria-current", "page");
  const workTitles = await work.locator("h3").allTextContents();

  await page.getByRole("tab", { name: "文章", exact: true }).click();
  await expect(articles.getByRole("button", { name: "1", exact: true })).toHaveAttribute("aria-current", "page");
  await articles.getByRole("button", { name: "2", exact: true }).click();
  const articleTitles = await articles.locator("h3").allTextContents();

  for (let round = 0; round < 3; round++) {
    await page.getByRole("tab", { name: "作品", exact: true }).click();
    await expect(work.getByRole("button", { name: "2", exact: true })).toHaveAttribute("aria-current", "page");
    expect(await work.locator("h3").allTextContents()).toEqual(workTitles);
    await expect(articles).toBeHidden();
    await page.getByRole("tab", { name: "文章", exact: true }).click();
    await expect(articles.getByRole("button", { name: "2", exact: true })).toHaveAttribute("aria-current", "page");
    expect(await articles.locator("h3").allTextContents()).toEqual(articleTitles);
    await expect(work).toBeHidden();
  }
  await articles.getByRole("button", { name: "上一页" }).click();
  await expect(articles.getByRole("button", { name: "上一页" })).toBeDisabled();
  await page.getByRole("tab", { name: "文章", exact: true }).press("ArrowLeft");
  await expect(page.getByRole("tab", { name: "作品", exact: true })).toBeFocused();
  await expect(work.getByRole("button", { name: "2", exact: true })).toHaveAttribute("aria-current", "page");
  expect(errors).toEqual([]);
});

test("直接打开文章锚点、重复导航、手机菜单保持可用", async ({ page, isMobile }) => {
  await page.goto("/#articles");
  const articles = page.getByRole("tabpanel", { name: "文章", exact: true });
  await expect(articles).toBeVisible();
  await articles.getByRole("button", { name: "2", exact: true }).click();
  if (isMobile) {
    await page.getByRole("button", { name: "菜单", exact: true }).click();
    await page.getByRole("navigation", { name: "移动导航" }).getByRole("link", { name: "文章", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "移动导航" })).toBeHidden();
  } else {
    await page.getByRole("navigation", { name: "主导航" }).getByRole("link", { name: "文章", exact: true }).click();
  }
  await expect(articles.getByRole("button", { name: "2", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".site-header")).toHaveCSS("--header-progress", "1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("详情页、目录、原图和站内返回链接可用", async ({ page }) => {
  for (const path of ["/work/frpc-editor/", "/articles/manufacturing/"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("article h1").first()).toBeVisible();
    const headingLinks = page.locator('aside a[href^="#"]');
    for (const href of await headingLinks.evaluateAll((links) => links.map((link) => link.getAttribute("href")!))) {
      expect(await page.evaluate((hash) => Boolean(document.getElementById(decodeURIComponent(hash.slice(1)))), href)).toBe(true);
    }
    await page.locator("article img").evaluateAll((images) => images.forEach((img) => (img as HTMLImageElement).loading = "eager"));
    await expect.poll(() => page.locator("article img").evaluateAll((images) => images.every((img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0))).toBe(true);
    const backLink = page.locator('article a[href^="/#"]').first();
    await backLink.click();
    await expect(page.getByRole("tab", { name: path.includes("/work/") ? "作品" : "文章", exact: true })).toHaveAttribute("aria-selected", "true");
  }
});

test("静态产物保留元数据、站点地图、图标和404", async ({ request }) => {
  const home = await request.get("/");
  const html = await home.text();
  expect(html).not.toContain("/_next/");
  if (!process.env.SITE_TEST_ORIGIN) expect(html).not.toContain("写内容");
  expect(html).toContain('rel="canonical"');
  expect(html).toContain('property="og:title"');
  for (const path of ["/robots.txt", "/sitemap.xml", "/favicon.ico", "/icon.svg"]) {
    expect((await request.get(path)).ok()).toBe(true);
  }
  const missing = await request.get("/not-a-real-page/");
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain("没有这页");
});
