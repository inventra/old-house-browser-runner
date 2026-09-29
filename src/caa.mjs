import { chromium } from "playwright";

const CAA_ENTRY = "https://web-gis2000.caa.gov.tw/caaPublic/";

export function parseCaaResultText(text) {
  const normalized = String(text).replaceAll(/\s+/g, " ");
  const airport = normalized.match(/機場名稱：\s*([^ ]+機場)/)?.[1];
  const elevationBaselineM = Number(normalized.match(/高程基準[^：]*：\s*海拔\s*([\d.]+)公尺/)?.[1]);
  const location = normalized.match(/坐落位置：\s*([^ ]+)/)?.[1];
  const heightLimitM = Number(normalized.match(/限建高度：\s*海拔\s*([\d.]+)公尺/)?.[1]);
  if (!airport || !location || !Number.isFinite(elevationBaselineM) || !Number.isFinite(heightLimitM)) {
    throw new Error("民航局查詢結果欄位不完整");
  }
  return { airport, elevationBaselineM, location, heightLimitM };
}

export async function queryCaaHeight({ xTwd97, yTwd97 }) {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ locale: "zh-TW" });
  try {
    await page.goto(CAA_ENTRY, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.getByRole("link", { name: "松山機場" }).click();
    await page.waitForTimeout(2_500);
    const banner = page.frames().find((frame) => frame.url().includes("BannerPub.aspx"));
    if (!banner) throw new Error("民航局查詢頁的功能列未載入");
    await banner.getByRole("link", { name: "依坐標查詢" }).click();
    await page.waitForTimeout(2_500);
    const query = page.frames().find((frame) => frame.url().includes("QxyPub.aspx"));
    if (!query) throw new Error("民航局坐標查詢表單未載入");
    await query.locator("#radXY").check();
    await query.locator("#txtX").fill(String(Math.round(xTwd97)));
    await query.locator("#txtY").fill(String(Math.round(yTwd97)));
    await query.locator("#butConfirmXY").click();
    await page.waitForTimeout(1_500);
    const resultText = await query.locator("body").innerText();
    return { ...parseCaaResultText(resultText), officialQueryUrl: CAA_ENTRY };
  } finally {
    await browser.close();
  }
}
