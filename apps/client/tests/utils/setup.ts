import { expect, Page } from "@playwright/test";

export async function createRoom(page: Page, name: string) {
  await page.goto("/");

  await page
    .getByLabel("Create a Room")
    .getByPlaceholder("Enter your name")
    .fill(name);
  await page.getByRole("button", { name: "Create Room" }).click();

  await page.waitForURL(/\/room\/.*/);

  const hasJoined = await hasJoinedRoom(page);
  if (!hasJoined) {
    throw new Error("Failed to verify room joining after creation");
  }

  return page.url();
}

export async function joinRoom(page: Page, roomUrl: string, name: string) {
  await page.goto(roomUrl);

  await page.waitForURL(/\/\?room=.*/);

  await page.getByPlaceholder("Enter your name").fill(name);
  await page.getByRole("button", { name: "Join Room", exact: true }).click();

  const hasJoined = await hasJoinedRoom(page);
  if (!hasJoined) {
    throw new Error("Failed to verify room joining");
  }
}

export async function hasJoinedRoom(page: Page) {
  await expect(page.getByRole("code")).toBeVisible(); // Code editor

  return true;
}
