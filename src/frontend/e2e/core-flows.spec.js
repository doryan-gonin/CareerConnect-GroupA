import { expect, test } from "@playwright/test";
import { API, createApplication, createJob, createUser, login } from "./helpers";

test("candidate updates their profile and uploads a PDF resume", async ({ page, request }) => {
  const candidate = await createUser(request);
  await login(page, candidate);

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("First Name", { exact: true }).fill("E2E");
  await page.getByLabel("Last Name", { exact: true }).fill("Candidate");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Profile updated successfully.", { exact: true })).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles({
    name: "e2e-resume.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF"),
  });
  await page.getByRole("button", { name: "Upload resume", exact: true }).click();
  await expect(
    page.getByText('"e2e-resume.pdf" uploaded successfully.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("e2e-resume.pdf", { exact: true })).toBeVisible();
});

test("candidate can save a job and remove it from saved jobs", async ({ page, request }) => {
  const recruiter = await createUser(request, true);
  const job = await createJob(request, recruiter);
  const candidate = await createUser(request);

  await login(page, candidate);
  await page.getByRole("link", { name: "Browse Jobs", exact: true }).click();
  await page.getByPlaceholder("Describe the job you want").fill(job.title);
  await page.getByRole("button", { name: "Search", exact: true }).click();

  const jobCard = page.locator('[role="button"]').filter({ hasText: job.title }).first();
  await jobCard.getByRole("button", { name: "Save job", exact: true }).click();
  await expect(
    jobCard.getByRole("button", { name: "Remove saved job", exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Saved Jobs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Saved jobs", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: job.title, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove saved job", exact: true }).click();
  await expect(page.getByText("You have no saved jobs yet.", { exact: true })).toBeVisible();
});

test("candidate filters applications and can withdraw one", async ({ page, request }) => {
  const recruiter = await createUser(request, true);
  const candidate = await createUser(request);
  const job = await createJob(request, recruiter);
  const application = await createApplication(request, candidate, job);
  await request.patch(`${API}/applications/${application.id}/status`, {
    headers: recruiter.headers,
    data: { status: "Interview" },
  });

  await login(page, candidate);
  const applications = page
    .getByRole("heading", { name: "My Applications", exact: true })
    .locator("../..");
  const filter = applications.locator("select");
  await filter.selectOption("Interview");
  await expect(applications.getByText(job.title, { exact: true })).toBeVisible();
  await filter.selectOption("Applied");
  await expect(
    applications.getByText('No applications with status "Applied".', { exact: true }),
  ).toBeVisible();
  await filter.selectOption("");
  page.once("dialog", (dialog) => dialog.accept());
  await applications.getByRole("button", { name: "Withdraw", exact: true }).click();
  await expect(
    applications.getByText(`Application for "${job.title}" withdrawn.`, { exact: true }),
  ).toBeVisible();
  await expect(
    applications.getByText("No applications submitted yet.", { exact: true }),
  ).toBeVisible();
});

test("candidate filters jobs by category and toggles AI suggestions", async ({ page, request }) => {
  const recruiter = await createUser(request, true);
  const dataJob = await createJob(request, recruiter, {
    category: "Data Science & AI",
  });
  const designJob = await createJob(request, recruiter, { category: "Design" });
  await login(page, await createUser(request));
  await page.getByRole("link", { name: "Browse Jobs", exact: true }).click();
  await page.getByRole("button", { name: "Category ▾", exact: true }).click();
  await page.getByRole("button", { name: "Data Science & AI", exact: true }).click();
  await expect(page.getByText(dataJob.title, { exact: true })).toBeVisible();
  await expect(page.getByText(designJob.title, { exact: true })).toHaveCount(0);
  const suggestions = page.getByRole("button", { name: /AI suggested/ });
  await suggestions.click();
  await expect(suggestions).toHaveAttribute("aria-pressed", "true");
});

test("recruiter reviews an applicant and closes and reopens a posting", async ({
  page,
  request,
}) => {
  const recruiter = await createUser(request, true);
  const candidate = await createUser(request);
  const job = await createJob(request, recruiter);
  const application = await createApplication(request, candidate, job);

  await login(page, recruiter);
  await page.goto(`/jobs/${job.id}/apply`);
  await expect(page).toHaveURL(new RegExp(`/jobs/${job.id}$`));
  await expect(page.getByRole("button", { name: /Apply/i })).toHaveCount(0);
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Recruiter Dashboard", exact: true }),
  ).toBeVisible();
  const jobCard = page.locator("article").filter({ hasText: job.title }).first();
  await jobCard.getByRole("button", { name: "View Applicants", exact: true }).click();
  const applicant = jobCard.locator(`[data-application-id="${application.id}"]`);
  await expect(applicant).toBeVisible();
  await applicant.getByRole("button", { name: "View Resume", exact: true }).click();
  await expect(page.getByRole("dialog", { name: /Resume/ })).toBeVisible();
  await page.getByRole("button", { name: "Close modal", exact: true }).click();
  await applicant.getByLabel("Application Status", { exact: true }).selectOption({
    label: "Interview",
  });
  await expect(applicant.getByRole("status")).toContainText("Status: Interview");

  page.once("dialog", (dialog) => dialog.accept());
  await jobCard.getByRole("button", { name: "Close Job", exact: true }).click();
  await expect(jobCard.getByText("Closed", { exact: true })).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await jobCard.getByRole("button", { name: "Reopen Job", exact: true }).click();
  await expect(jobCard.getByText("Active", { exact: true })).toBeVisible();
});

test("recruiter can create and edit a job posting", async ({ page, request }) => {
  await login(page, await createUser(request, true));
  await page.getByRole("button", { name: "+ Create Job", exact: true }).click();
  const form = page.getByRole("heading", { name: "Create Job Posting", exact: true }).locator("..");
  const title = `Created E2E Job ${Date.now()}`;
  await form.locator('input[name="title"]').fill(title);
  await form.locator('input[name="company_name"]').fill("E2E Company");
  await form.locator("#create-job-location").fill("Montreal, QC");
  await form.getByPlaceholder(/Describe the responsibilities/).fill("Build reliable products.");
  await form.getByRole("button", { name: "Publish Job", exact: true }).click();
  const jobCard = page.locator("article").filter({ hasText: title }).first();
  await expect(jobCard).toBeVisible();

  await jobCard.getByRole("button", { name: "Edit Job", exact: true }).click();
  await jobCard.locator('input[name="title"]').fill(`${title} Updated`);
  await jobCard.getByRole("button", { name: "Save Changes", exact: true }).click();
  await expect(page.getByText(`${title} Updated`, { exact: true })).toBeVisible();
});

test("candidate cannot enter recruiter dashboard directly", async ({ page, request }) => {
  await login(page, await createUser(request));
  await page.goto("/recruiter/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
});

test("candidate starts an interview session and sends a practice answer", async ({
  page,
  request,
}) => {
  const recruiter = await createUser(request, true);
  const candidate = await createUser(request);
  const job = await createJob(request, recruiter);
  await createApplication(request, candidate, job);

  await login(page, candidate);
  await page.getByRole("link", { name: "Interview Prep", exact: true }).click();
  await page.getByRole("button", { name: "New session", exact: true }).click();
  const applicationOption = page.getByRole("option").filter({ hasText: job.title });
  await page
    .getByRole("combobox", { name: /Which application/ })
    .selectOption(await applicationOption.getAttribute("value"));
  await page.getByRole("button", { name: "Start session", exact: true }).click();
  await expect(page.getByRole("heading", { name: job.title, exact: true })).toBeVisible();

  await page
    .getByPlaceholder("Type your answer or question")
    .fill("I enjoy solving practical problems.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText("I enjoy solving practical problems.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/STAR method/)).toBeVisible();
});

test("analytics renders its candidate summary cards", async ({ page, request }) => {
  await login(page, await createUser(request));
  await page.getByRole("button", { name: "View analytics", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Analytics", exact: true })).toBeVisible();
  await expect(page.getByText("Searches", { exact: true })).toBeVisible();
  await expect(page.getByText("Applications", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Salary distribution of applied positions", { exact: true }),
  ).toBeVisible();
});
