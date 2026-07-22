import { expect, test } from "@playwright/test";

import { createRoom, joinRoom } from "@/tests/utils/setup";

test.describe("Room Sharing", () => {
  test("should handle room sharing functionality", async ({ page }) => {
    await createRoom(page, "TestUser");

    const shareButton = page.getByLabel("Share this coding room");
    await shareButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const roomUrl = page.url();
    if (!roomUrl) throw new Error("Room URL not found");
    const roomId = roomUrl.split("/").pop();
    if (!roomId) throw new Error("Room ID not found in URL");

    const actualRoomId = page.getByTestId("room-id-text");
    const actualRoomUrl = page.getByTestId("invite-link-text");

    await expect(actualRoomId).toHaveText(roomId);
    await expect(actualRoomUrl).toHaveText(roomUrl);

    const copyRoomIdButton = page.getByTestId("room-id-copy-button");
    const copyLinkButton = page.getByTestId("invite-link-copy-button");

    await copyRoomIdButton.click();
    await copyLinkButton.click();

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("should allow multiple users to join same room", async ({ browser }) => {
    const userAContext = await browser.newContext();
    const userBContext = await browser.newContext();

    const userAPage = await userAContext.newPage();
    const userBPage = await userBContext.newPage();

    const roomUrl = await createRoom(userAPage, "User A");
    await joinRoom(userBPage, roomUrl, "User B");

    await expect(userAPage.getByText("User A")).toBeVisible();
    await expect(userAPage.getByText("User B")).toBeVisible();
    await expect(userBPage.getByText("User A")).toBeVisible();
    await expect(userBPage.getByText("User B")).toBeVisible();
  });
});
