import { z } from "zod";
import type {
  AnalyticsResponseByEndpoint,
  AnalyticsResponse,
  Application,
  ApplicationDetail,
  Job,
  JobListResponse,
  Profile,
  RecruiterApplication,
  Resume,
  SavedJob,
  TokenResponse,
  User,
} from "./types";

const dateString = z.string().min(1);

export const jobScheduleSchema = z.enum(["Full-time", "Part-time"]);
export const jobTypeSchema = z.enum([
  "Permanent",
  "Temporary",
  "Contract",
  "Seasonal",
  "Internship",
]);
export const applicationStatusSchema = z.enum([
  "Applied",
  "Under Review",
  "Interview",
  "Offered",
  "Rejected",
]);
export const notificationTypeSchema = z.enum([
  "status_update",
  "interview_invitation",
  "application_received",
  "system",
  "deadline_reminder",
]);
export const interviewRoleSchema = z.enum(["user", "assistant"]);
export const analyticsGranularitySchema = z.enum(["day", "week", "month"]);

export const userSchema: z.ZodType<User> = z
  .object({
    id: z.number(),
    email_address: z.string().email(),
    is_recruiter: z.boolean(),
    created_at: dateString,
  })
  .passthrough();

export const tokenResponseSchema: z.ZodType<TokenResponse> = z
  .object({
    access_token: z.string().min(1),
    token_type: z.string().min(1),
    is_recruiter: z.boolean().optional(),
  })
  .passthrough();

export const profileSchema: z.ZodType<Profile> = z
  .object({
    id: z.number(),
    user_id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    last_updated: dateString.nullable().optional(),
  })
  .passthrough();

export const resumeSchema: z.ZodType<Resume> = z
  .object({
    id: z.number(),
    user_id: z.number(),
    file_name: z.string().min(1),
    is_default: z.boolean(),
    uploaded_at: dateString,
  })
  .passthrough();

export const jobSchema: z.ZodType<Job> = z
  .object({
    id: z.number(),
    recruiter_id: z.number().nullable().optional(),
    title: z.string(),
    company_name: z.string(),
    description: z.string(),
    location: z.string(),
    category: z.string(),
    job_type: jobTypeSchema,
    job_schedule: jobScheduleSchema,
    min_hours_per_week: z.number().nullable().optional(),
    max_hours_per_week: z.number().nullable().optional(),
    salary_min: z.number().nullable().optional(),
    salary_max: z.number().nullable().optional(),
    is_active: z.boolean(),
    posted_at: dateString,
    deadline: dateString.nullable().optional(),
    ai_suggested: z.boolean().optional(),
    suggestion_score: z.number().nullable().optional(),
    suggestion_justification: z.string().nullable().optional(),
  })
  .passthrough();

export const savedJobSchema: z.ZodType<SavedJob> = z
  .object({
    id: z.number(),
    user_id: z.number(),
    job_id: z.number(),
    saved_at: dateString,
    job: jobSchema,
  })
  .passthrough();

export const jobListResponseSchema: z.ZodType<JobListResponse> = z
  .object({
    jobs: z.array(jobSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    total_pages: z.number(),
  })
  .passthrough();

export const applicationSchema: z.ZodType<Application> = z
  .object({
    id: z.number(),
    job_id: z.number(),
    applicant_id: z.number(),
    resume_id: z.number().nullable().optional(),
    cover_letter: z.string().nullable().optional(),
    status: applicationStatusSchema,
    applied_at: dateString,
    updated_at: dateString.nullable().optional(),
    message: z.string().nullable().optional(),
  })
  .passthrough();

export const recruiterApplicationSchema: z.ZodType<RecruiterApplication> = applicationSchema.and(
  z.object({
    applicant_name: z.string(),
    applicant_email: z.string().email().nullable().optional(),
    resume_name: z.string().nullable().optional(),
  }),
);

export const applicationDetailSchema: z.ZodType<ApplicationDetail> = applicationSchema.and(
  z.object({
    resume_name: z.string().nullable().optional(),
    job_title: z.string(),
    company_name: z.string(),
    location: z.string(),
    category: z.string(),
    job_type: jobTypeSchema,
    job_schedule: jobScheduleSchema,
  }),
);

export const notificationSchema = z
  .object({
    id: z.number(),
    user_id: z.number(),
    title: z.string(),
    message: z.string(),
    notification_type: notificationTypeSchema,
    is_read: z.boolean(),
    created_at: dateString,
    reference_id: z.number().nullable().optional(),
    reference_type: z.string().nullable().optional(),
  })
  .passthrough();

export const notificationListSchema = z
  .object({
    total_count: z.number(),
    unread_count: z.number(),
    notifications: z.array(notificationSchema),
  })
  .passthrough();

export const interviewMessageSchema = z
  .object({ role: interviewRoleSchema, content: z.string() })
  .passthrough();

export const interviewSessionSummarySchema = z
  .object({
    id: z.number(),
    job_id: z.number(),
    job_title: z.string(),
    company_name: z.string(),
    created_at: dateString,
    updated_at: dateString,
  })
  .passthrough();

export const interviewSessionSchema = interviewSessionSummarySchema.and(
  z.object({ messages: z.array(interviewMessageSchema) }),
);

const applicationAnalyticsSchema = z
  .object({
    start_date: dateString,
    end_date: dateString,
    group_by: analyticsGranularitySchema,
    points: z.array(z.object({ period: dateString, count: z.number() }).passthrough()),
  })
  .passthrough();

const viewAnalyticsSchema = z
  .object({
    start_date: dateString,
    end_date: dateString,
    group_by: analyticsGranularitySchema,
    points: z.array(z.object({ period: dateString, unique_postings: z.number() }).passthrough()),
  })
  .passthrough();

const salaryDistributionSchema = z
  .object({
    start_date: dateString,
    end_date: dateString,
    salary_count: z.number(),
    average_salary: z.number().nullable(),
    minimum_salary: z.number().nullable(),
    maximum_salary: z.number().nullable(),
    standard_deviation: z.number().nullable(),
  })
  .passthrough();

const applicationSummarySchema = z
  .object({
    start_date: dateString,
    end_date: dateString,
    category: z.string().nullable(),
    category_count: z.number(),
    location: z.string().nullable(),
    location_count: z.number(),
  })
  .passthrough();

export const analyticsResponseSchemas: {
  [K in keyof AnalyticsResponseByEndpoint]: z.ZodType<AnalyticsResponse>;
} = {
  applications: applicationAnalyticsSchema,
  searches: applicationAnalyticsSchema,
  views: viewAnalyticsSchema,
  "salary-distribution": salaryDistributionSchema,
  "application-summary": applicationSummarySchema,
};

export const emptyResponseSchema = z.unknown().transform(() => undefined);

export const loginFormSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(1, "Password is required."),
  })
  .strict();

export const signupFormSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(1, "Password is required."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    isRecruiter: z.boolean(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const profileFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
  })
  .strict();

export const applicationFormSchema = z
  .object({
    resumeId: z.number().int().positive(),
    coverLetter: z.string().max(10000).nullable(),
  })
  .strict();

export const interviewMessageFormSchema = z
  .object({ content: z.string().trim().min(1).max(2000) })
  .strict();

export const interviewSessionFormSchema = z
  .object({ applicationId: z.number().int().positive("Select an application.") })
  .strict();

export const jobFormSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required."),
    company_name: z.string().trim().min(1, "Company name is required."),
    description: z.string().trim().min(1, "Description is required."),
    location: z.string().trim().min(1, "Location is required."),
    category: z.string().trim().min(1, "Category is required."),
    job_type: jobTypeSchema,
    job_schedule: jobScheduleSchema,
    min_hours_per_week: z.number().nonnegative().nullable(),
    max_hours_per_week: z.number().nonnegative().nullable(),
    salary_min: z.number().nonnegative().nullable(),
    salary_max: z.number().nonnegative().nullable(),
  })
  .superRefine((value, context) => {
    if (
      value.min_hours_per_week !== null &&
      value.max_hours_per_week !== null &&
      value.min_hours_per_week > value.max_hours_per_week
    ) {
      context.addIssue({
        code: "custom",
        path: ["max_hours_per_week"],
        message: "Maximum hours must be at least the minimum.",
      });
    }
    if (
      value.salary_min !== null &&
      value.salary_max !== null &&
      value.salary_min > value.salary_max
    ) {
      context.addIssue({
        code: "custom",
        path: ["salary_max"],
        message: "Maximum salary must be at least the minimum.",
      });
    }
  });
