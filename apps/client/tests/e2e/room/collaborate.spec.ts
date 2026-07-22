import { expect, test } from "@playwright/test";

import { createRoom, joinRoom } from "@/tests/utils/setup";

test.describe("Collaborative Features", () => {
  test("should sync code changes between users in real-time", async ({
    browser,
  }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, "User A");
    await joinRoom(userBPage, roomUrl, "User B");

    const userAEditor = userAPage.locator(".view-lines");
    const userBEditor = userBPage.locator(".view-lines");

    const TEST_CODE1 = 'console.log("Hello World");';
    const TEST_CODE2 = 'console.log("Collaborative editing works!");';
    const EXPECTED_CODE = `${TEST_CODE1}${TEST_CODE2}`;

    await userAEditor.pressSequentially(TEST_CODE1);

    await expect(userBPage.getByText(TEST_CODE1)).toBeVisible();

    await userBPage.keyboard.press("Enter");
    await userBEditor.pressSequentially(TEST_CODE2);

    await expect(userAPage.getByText(EXPECTED_CODE)).toBeVisible();
    await expect(userBPage.getByText(EXPECTED_CODE)).toBeVisible();
  });

  test("should execute code and show output in shared terminal", async ({
    browser,
  }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, "User A");
    await joinRoom(userBPage, roomUrl, "User B");

    const editor = userAPage.locator(".view-lines");
    await editor.pressSequentially('print("Hello from Python!")');

    await userAPage.getByLabel("Select programming language").click();
    await userAPage.getByText("Python", { exact: true }).click();

    await userAPage.getByLabel("Run code").click();

    const terminal = "Hello from Python!";
    const outputSelector = "div.flex-1 > div.whitespace-pre-wrap.break-all";

    await expect(
      userAPage.locator(outputSelector).filter({ hasText: terminal })
    ).toBeVisible();

    await expect(
      userBPage.locator(outputSelector).filter({ hasText: terminal })
    ).toBeVisible();
  });

  test("should sync notepad edits between users", async ({ browser }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, "User A");
    await joinRoom(userBPage, roomUrl, "User B");

    const userANotepad = userAPage.getByLabel("editable markdown");
    const userBNotepad = userBPage.getByLabel("editable markdown");

    await userANotepad.pressSequentially(
      "# Collaborative Notes\nThis is a shared note."
    );

    await expect(userBPage.getByText("Collaborative Notes")).toBeVisible();
    await expect(userBPage.getByText("This is a shared note.")).toBeVisible();

    await userBNotepad.press("Control+a");
    await userBNotepad.press("ArrowRight");
    await userBNotepad.pressSequentially("Adding more collaborative content!");

    await userAPage.getByLabel("Source mode").click({ force: true });
    await userBPage.getByLabel("Source mode").click({ force: true });

    const codeMirrorSelector = ".cm-content";
    await userAPage.waitForSelector(codeMirrorSelector);
    await userBPage.waitForSelector(codeMirrorSelector);

    await expect(
      userAPage.locator(".cm-line").filter({ hasText: "# Collaborative Notes" })
    ).toBeVisible();
    await expect(
      userAPage
        .locator(".cm-line")
        .filter({ hasText: "This is a shared note." })
    ).toBeVisible();
    await expect(
      userAPage
        .locator(".cm-line")
        .filter({ hasText: "Adding more collaborative content!" })
    ).toBeVisible();

    await expect(
      userBPage.locator(".cm-line").filter({ hasText: "# Collaborative Notes" })
    ).toBeVisible();
    await expect(
      userBPage
        .locator(".cm-line")
        .filter({ hasText: "This is a shared note." })
    ).toBeVisible();
    await expect(
      userBPage
        .locator(".cm-line")
        .filter({ hasText: "Adding more collaborative content!" })
    ).toBeVisible();
  });
});
