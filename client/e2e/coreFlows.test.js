import { test, expect } from "@playwright/test";

async function registerAndLogin(page, { email, displayName, password }) {
  await page.goto("/");
  await page.getByRole("button", { name: /register/i }).click();

  await page.locator("#firstName").fill("Test");
  await page.locator("#lastName").fill("User");
  await page.locator("#email").fill(email);
  await page.locator("#displayName").fill(displayName);
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();

  await page.getByRole("button", { name: /login/i }).click();
  await page.locator("#loginEmail").fill(email);
  await page.locator("#loginPassword").fill(password);
  await page.getByRole("button", { name: /^login$/i }).click();

  await expect(page.getByRole("heading", { name: /home/i })).toBeVisible();
}

async function createCommunity(page, communityName) {
  await page.getByRole("button", { name: /create community/i }).click();
  await page.locator("#communityName").fill(communityName);
  await page.locator("#communityDescription").fill("Community created by a Playwright smoke test.");
  await page.getByRole("button", { name: /submit/i }).click();
  await expect(page.getByRole("heading", { name: /home/i })).toBeVisible();
}

async function createPost(page, { title, content, flair }) {
  await page.getByRole("button", { name: /create post/i }).first().click();
  await page.locator("#postTitle").fill(title);
  await page.locator("#postContent").fill(content);
  if (flair) {
    await page.locator("#postNewFlair").fill(flair);
  }
  await page.getByRole("button", { name: /submit/i }).click();
  await expect(page.getByRole("heading", { name: /home/i })).toBeVisible();
  await expect(page.getByRole("button", { name: title })).toBeVisible();
}

test("core community, post, flair, active sort, vote, comment, and profile flows work", async ({ page }) => {
  const stamp = Date.now();
  const password = "SafePassword123!";
  const email = `core${stamp}@example.com`;
  const displayName = `coreuser${stamp}`;
  const communityName = `corecommunity${stamp}`;
  const flair = `Question ${stamp}`;
  const activeTitle = `Active Thread ${stamp}`;
  const quietTitle = `Quiet Thread ${stamp}`;
  const editedTitle = `Edited Thread ${stamp}`;
  const commentText = `Activity comment ${stamp}`;

  page.on("dialog", (dialog) => dialog.accept());

  await registerAndLogin(page, { email, displayName, password });
  await createCommunity(page, communityName);
  await createPost(page, {
    title: activeTitle,
    content: "This post will receive comments and votes.",
    flair
  });
  await createPost(page, {
    title: quietTitle,
    content: "This post should stay below active threads."
  });

  await page.getByRole("button", { name: activeTitle }).click();
  await expect(page.getByRole("button", { name: /upvote/i })).toBeDisabled();
  await page.getByRole("button", { name: /^save$/i }).click();
  await expect(page.getByRole("button", { name: /^saved$/i })).toBeVisible();
  await page.getByPlaceholder("Write a comment").fill(commentText);
  await page.getByRole("button", { name: /add comment/i }).click();
  await expect(page.getByText(commentText)).toBeVisible();

  await page.getByRole("button", { name: /back home/i }).click();
  await page.locator("#homeFlair").selectOption({ label: flair });
  await expect(page.getByRole("button", { name: activeTitle })).toBeVisible();
  await expect(page.getByRole("button", { name: quietTitle })).toHaveCount(0);
  await page.getByRole("button", { name: /clear/i }).click();
  await page.getByRole("button", { name: "Active", exact: true }).click();

  const titles = await page.locator(".post-card h3").allTextContents();
  expect(titles[0]).toContain(activeTitle);

  await page.getByRole("button", { name: displayName }).click();
  const postRow = page.locator(".row-card").filter({ hasText: activeTitle });
  await postRow.getByRole("button", { name: /edit/i }).click();
  await page.locator('input[name="title"]').fill(editedTitle);
  await page.getByRole("button", { name: /save/i }).click();
  await expect(page.locator(".row-card").filter({ hasText: editedTitle })).toBeVisible();

  await page.getByRole("tab", { name: /saved/i }).click();
  await expect(page.locator(".row-card").filter({ hasText: editedTitle })).toBeVisible();

  await page.getByRole("tab", { name: /comments/i }).click();
  await expect(page.locator(".row-card").filter({ hasText: commentText })).toBeVisible();
  await page.locator(".row-card").filter({ hasText: commentText }).getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("No comments yet.")).toBeVisible();
});
