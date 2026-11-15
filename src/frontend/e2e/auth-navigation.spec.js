import { expect, test } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { createUser, login, PASSWORD } from "./helpers";

test("signup validates confirmation, creates an account, logs in and logs out", async ({
  page,
}) => {
  const email = `browser-${randomUUID()}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.locator('input[type="password"]').nth(0).fill(PASSWORD);
  await page.locator('input[type="password"]').nth(1).fill("Different123!");
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page.getByText("Passwords do not match.")).toBeVisible();
  await page.locator('input[type="password"]').nth(1).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page.getByText("Account created! You can now log in.")).toBeVisible();
  await login(page, { email });
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});

test("invalid credentials stay on login with feedback", async ({ page, request }) => {
  const user = await createUser(request);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill("WrongPass123!");
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(page.getByText(/incorrect|invalid/i)).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("candidate navigation supports interview, analytics and browser back", async ({
  page,
  request,
}) => {
  await login(page, await createUser(request));
  await page.getByRole("link", { name: "Interview Prep", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Interview Prep", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "View analytics", exact: true }).click();
  await expect(page).toHaveURL(/\/analytics$/);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
});

test("recruiters cannot open candidate-only routes", async ({ page, request }) => {
  await login(page, await createUser(request, true));
  await expect(page.getByRole("link", { name: "Interview Prep" })).toHaveCount(0);
  await page.goto("/interview");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/analytics");
  await expect(page).toHaveURL(/\/dashboard$/);
});
