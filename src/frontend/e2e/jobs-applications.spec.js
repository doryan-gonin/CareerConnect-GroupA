import { expect, test } from "@playwright/test";
import { API, createJob, createResume, createUser, json, login } from "./helpers";

test("candidate searches, opens posting, submits resume and sees duplicate protection", async ({
  page,
  request,
}) => {
  const candidate = await createUser(request);
  const recruiter = await createUser(request, true);
  const job = await createJob(request, recruiter);
  await createResume(request, candidate);
  await login(page, candidate);
  await page.getByRole("link", { name: "Browse Jobs", exact: true }).click();
  await page.getByPlaceholder("Describe the job you want").fill(job.title);
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(job.title) }).click();
  await page.getByRole("link", { name: "Expand", exact: true }).click();
  await expect(page.getByRole("heading", { name: job.title, exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Apply Now/i }).click();
  await expect(
    page.getByRole("heading", { name: "Submit Your Application", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit Application", exact: true }).click();
  await expect(page.getByText("Your application was submitted successfully!")).toBeVisible();
  const applications = await json(
    await request.get(`${API}/applications/me`, { headers: candidate.headers }),
  );
  expect(applications).toHaveLength(1);
  expect(applications[0].job_id).toBe(job.id);
  await page.getByRole("button", { name: /Back to Posting/ }).click();
  await expect(page.getByRole("button", { name: /Already Applied/i })).toBeDisabled();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page.getByText(job.title, { exact: true })).toBeVisible();
});

test("search gives meaningful empty results and reset restores jobs", async ({ page, request }) => {
  await createJob(request, await createUser(request, true));
  await login(page, await createUser(request));
  await page.getByRole("link", { name: "Browse Jobs", exact: true }).click();
  await page.getByPlaceholder("Describe the job you want").fill("no-such-job-xyz-123");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("No jobs found matching your search.")).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByPlaceholder("Describe the job you want")).toHaveValue("");
  await expect(page.getByText(/Showing 1/)).toBeVisible();
});
