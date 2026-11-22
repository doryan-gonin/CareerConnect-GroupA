import { test, expect } from '@playwright/test'
import {
  createUser,
  createJob,
  closeJob,
  getSavedJobIds,
  saveJobViaApi,
  loginViaUi,
  searchJobByTitle,
  openSavedJobsTab,
} from './helpers.js'

// US-05 Saved Jobs: end-to-end flows through the real UI and API

test.describe('Saved jobs', () => {
  let recruiter
  let applicant
  let job

  test.beforeEach(async ({ request }) => {
    recruiter = await createUser(request, { isRecruiter: true })
    applicant = await createUser(request)
    job = await createJob(request, recruiter)
  })

  test('applicant can bookmark a job from the job card and see it in Saved Jobs', async ({ page, request }) => {
    await loginViaUi(page, applicant)

    const card = await searchJobByTitle(page, job.title)
    const bookmark = card.getByRole('button', { name: 'Save job' })
    await expect(bookmark).toHaveAttribute('aria-pressed', 'false')

    await bookmark.click()

    await expect(card.getByRole('button', { name: 'Remove from saved jobs' })).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => getSavedJobIds(request, applicant)).toEqual([job.id])

    const savedSection = await openSavedJobsTab(page)
    const item = savedSection.getByTestId('saved-job-item').filter({ hasText: job.title })
    await expect(item).toHaveCount(1)
    await expect(item).toContainText('E2E Corp')
  })

  test('bookmark state persists after reloading the job browsing page', async ({ page }) => {
    await loginViaUi(page, applicant)

    const card = await searchJobByTitle(page, job.title)
    await card.getByRole('button', { name: 'Save job' }).click()
    await expect(card.getByRole('button', { name: 'Remove from saved jobs' })).toBeVisible()

    await page.reload()
    const reloadedCard = await searchJobByTitle(page, job.title)
    await expect(reloadedCard.getByRole('button', { name: 'Remove from saved jobs' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('applicant can unsave a job by unclicking the bookmark on the job browsing page', async ({ page, request }) => {
    await saveJobViaApi(request, applicant, job.id)
    await loginViaUi(page, applicant)

    const card = await searchJobByTitle(page, job.title)
    await card.getByRole('button', { name: 'Remove from saved jobs' }).click()

    await expect(card.getByRole('button', { name: 'Save job' })).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(() => getSavedJobIds(request, applicant)).toEqual([])

    const savedSection = await openSavedJobsTab(page)
    await expect(savedSection.getByTestId('saved-job-item')).toHaveCount(0)
    await expect(savedSection).toContainText('No saved jobs yet.')
  })

  test('applicant can unsave a job from the Saved Jobs tab', async ({ page, request }) => {
    await saveJobViaApi(request, applicant, job.id)
    await loginViaUi(page, applicant)

    const savedSection = await openSavedJobsTab(page)
    const item = savedSection.getByTestId('saved-job-item').filter({ hasText: job.title })
    await item.getByRole('button', { name: 'Remove from saved jobs' }).click()

    await expect(item).toHaveCount(0)
    await expect.poll(() => getSavedJobIds(request, applicant)).toEqual([])

    // The job browsing page reflects the removal too
    const card = await searchJobByTitle(page, job.title)
    await expect(card.getByRole('button', { name: 'Save job' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('bookmark in the job preview panel stays in sync with the job card', async ({ page }) => {
    await loginViaUi(page, applicant)

    const card = await searchJobByTitle(page, job.title)
    await card.getByRole('heading', { name: job.title }).click()

    // Two bookmark buttons for this job are now visible: the card and the preview panel
    const savedButtons = page.getByRole('button', { name: 'Remove from saved jobs' })
    await page.getByRole('button', { name: 'Save job' }).last().click()
    await expect(savedButtons).toHaveCount(2)
  })

  test('clicking a saved job opens its posting', async ({ page, request }) => {
    await saveJobViaApi(request, applicant, job.id)
    await loginViaUi(page, applicant)

    const savedSection = await openSavedJobsTab(page)
    await savedSection.getByRole('button', { name: job.title }).click()

    await expect(page).toHaveURL(new RegExp(`/jobs/${job.id}$`))
    await expect(page.getByRole('heading', { name: job.title })).toBeVisible()
  })

  test('a job closed after saving stays in the list with a Closed badge', async ({ page, request }) => {
    await saveJobViaApi(request, applicant, job.id)
    await closeJob(request, recruiter, job.id)
    await loginViaUi(page, applicant)

    const savedSection = await openSavedJobsTab(page)
    const item = savedSection.getByTestId('saved-job-item').filter({ hasText: job.title })
    await expect(item).toHaveCount(1)
    await expect(item.getByText('Closed', { exact: true })).toBeVisible()
  })

  test('saved jobs are private to each applicant', async ({ page, request }) => {
    const otherApplicant = await createUser(request)
    await saveJobViaApi(request, otherApplicant, job.id)
    await loginViaUi(page, applicant)

    const savedSection = await openSavedJobsTab(page)
    await expect(savedSection.getByTestId('saved-job-item')).toHaveCount(0)
  })

  test('recruiters do not see bookmark buttons', async ({ page }) => {
    await loginViaUi(page, recruiter)

    const card = await searchJobByTitle(page, job.title)
    await expect(card).toBeVisible()
    await expect(page.getByTestId('bookmark-button')).toHaveCount(0)
  })
})
