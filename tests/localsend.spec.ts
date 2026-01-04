import { expect, Page, test } from "@playwright/test";
import { readFileSync } from "fs";
import path from "path";

test.describe("LocalSend.org", () => {
  test("should share a file", async ({ page, browser }) => {
    await page.goto("https://web.localsend.org/");

    const page2 = await browser.newPage();
    await page2.goto("https://web.localsend.org/");

    await page.bringToFront();

    const recipientUserElement = page
      .locator("div")
      .filter({ hasText: /•/ })
      .nth(5);

    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      recipientUserElement.click(),
    ]);

    await fileChooser.setFiles(path.resolve("demo.txt"));

    const sendingFilesDialog = page
      .getByRole("dialog")
      .filter({ hasText: "Sending files..." });

    await expect(sendingFilesDialog).toBeVisible();

    const downloadingFilesDialog = page2
      .getByRole("dialog")
      .filter({ hasText: "Receiving files" });

    const [download] = await Promise.all([page2.waitForEvent("download")]);

    await expect(downloadingFilesDialog).toBeVisible({ timeout: 60_000 });

    const downloadPath = path.resolve("downloaded-demo.txt");
    await download.saveAs(downloadPath);

    expect(readFileSync(downloadPath, { encoding: "utf-8" })).toContain(
      "Some very important information",
    );
  });
});
