import { expect, test } from "@playwright/test";
import {
  API,
  createApplication,
  createJob,
  createUser,
  json,
  login,
  notifications,
} from "./helpers";

async function setup(request) {
  const candidate = await createUser(request);
  const recruiter = await createUser(request, true);
  const job = await createJob(request, recruiter);
  const application = await createApplication(request, candidate, job);
  for (const status of ["Under Review", "Interview"]) {
    await json(
      await request.patch(`${API}/applications/${application.id}/status`, {
        headers: recruiter.headers,
        data: { status },
      }),
    );
  }
  return { candidate, recruiter, job, application };
}

test("candidate reads, marks all read and dismisses persisted notifications", async ({
  page,
  request,
}) => {
  const { candidate, job } = await setup(request);
  await login(page, candidate);
  await page.getByRole("button", { name: "Notifications (2 unread)", exact: true }).click();
  await expect(page.getByText(`Interview Invitation: ${job.title}`, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark all read", exact: true }).click();
  await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeVisible();
  expect((await notifications(request, candidate)).unread_count).toBe(0);
  await page.getByRole("button", { name: "Dismiss", exact: true }).first().click();
  await expect(page.getByRole("button", { name: "Dismiss", exact: true })).toHaveCount(1);
  expect((await notifications(request, candidate)).total_count).toBe(1);
  await page.reload();
  await page.getByRole("button", { name: "Notifications", exact: true }).click();
  await expect(page.getByRole("button", { name: "Dismiss", exact: true })).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toHaveCount(0);
});

test("candidate notification click from job search opens the referenced context", async ({
  page,
  request,
}) => {
  const { candidate, job } = await setup(request);
  await login(page, candidate);
  await page.getByRole("link", { name: "Browse Jobs", exact: true }).click();
  await page.getByRole("button", { name: "Notifications (2 unread)", exact: true }).click();
  await page
    .getByRole("button", { name: new RegExp(`Interview Invitation: ${job.title}`) })
    .click();
  await expect(page.getByRole("heading", { name: job.title, exact: true })).toBeVisible();
  expect((await notifications(request, candidate)).unread_count).toBe(1);
});

test("recruiter receives a new-application notification for the correct application", async ({
  page,
  request,
}) => {
  const { recruiter, job, application } = await setup(request);
  const data = await notifications(request, recruiter);
  expect(data.notifications[0].reference_id).toBe(application.id);
  await login(page, recruiter);
  await page.getByRole("button", { name: "Notifications (1 unread)", exact: true }).click();
  await expect(page.getByText(`New Application: ${job.title}`, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: new RegExp(`New Application: ${job.title}`) }).click();
  await expect(page.getByRole("heading", { name: job.title, exact: true })).toBeVisible();
  expect((await notifications(request, recruiter)).unread_count).toBe(0);
});
