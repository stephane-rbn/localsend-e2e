import { expect, Page, test } from "@playwright/test";
import { readFileSync } from "fs";
import path from "path";

let senderPage: Page;
let receiverPage: Page;

async function uploadFile(page: Page, filePath: string) {
  const receiverElement = page.locator("div").filter({ hasText: /•/ }).nth(5);

  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    receiverElement.click(),
  ]);

  await fileChooser.setFiles(filePath);
}

async function expectDialog(page: Page, dialogTitle: string, timeout?: number) {
  const dialog = page.getByRole("dialog").filter({ hasText: dialogTitle });

  await expect(dialog).toBeVisible(timeout ? { timeout: timeout } : undefined);
}

test.describe("should send and receive a file between two users", () => {
  test.beforeEach(async ({ page, browser }) => {
    senderPage = page;
    receiverPage = await browser.newPage();

    await receiverPage.goto("https://web.localsend.org/");
    await senderPage.goto("https://web.localsend.org/");
  });

  test("should upload a file", async () => {
    await uploadFile(senderPage, path.resolve("demo.txt"));
    await expectDialog(senderPage, "Sending files...");
  });

  test("should receive and verify a file", async () => {
    await uploadFile(senderPage, path.resolve("demo.txt"));

    const [download] = await Promise.all([
      receiverPage.waitForEvent("download"),
    ]);

    await expectDialog(receiverPage, "Receiving files...", 60_000);

    const downloadPath = path.resolve("downloaded-demo.txt");
    await download.saveAs(downloadPath);

    expect(readFileSync(downloadPath, { encoding: "utf-8" })).toContain(
      "Some very important information",
    );
  });
});
