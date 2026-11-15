export type ISODateString = string;

export type JobSchedule = "Full-time" | "Part-time";
export type JobType = "Permanent" | "Temporary" | "Contract" | "Seasonal" | "Internship";
export type JobSortBy =
  | "posted_at"
  | "salary_max"
  | "salary_min"
  | "max_hours_per_week"
  | "suggestion";
export type JobSortOrder = "asc" | "desc";
export type ApplicationStatus = "Applied" | "Under Review" | "Interview" | "Offered" | "Rejected";
export type NotificationType =
  | "status_update"
  | "interview_invitation"
  | "application_received"
  | "system"
  | "deadline_reminder";
export type InterviewRole = "user" | "assistant";
export type AnalyticsGranularity = "day" | "week" | "month";

export interface User {
  id: number;
  email_address: string;
  is_recruiter: boolean;
  created_at: ISODateString;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  is_recruiter?: boolean;
}

export interface Profile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  last_updated?: ISODateString | null;
}

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
}

export interface Resume {
  id: number;
  user_id: number;
  file_name: string;
  is_default: boolean;
  uploaded_at: ISODateString;
}

export interface Job {
  id: number;
  recruiter_id?: number | null;
  title: string;
  company_name: string;
  description: string;
  location: string;
  category: string;
  job_type: JobType;
  job_schedule: JobSchedule;
  min_hours_per_week?: number | null;
  max_hours_per_week?: number | null;
  salary_min?: number | null;
  salary_max?: number | null;
  is_active: boolean;
  posted_at: ISODateString;
  deadline?: ISODateString | null;
  ai_suggested?: boolean;
  suggestion_score?: number | null;
  suggestion_justification?: string | null;
}

export interface SavedJob {
  id: number;
  user_id: number;
  job_id: number;
  saved_at: ISODateString;
  job: Job;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface JobCreate {
  title: string;
  company_name: string;
  description: string;
  location: string;
  category: string;
  job_type?: JobType;
  job_schedule?: JobSchedule;
  min_hours_per_week?: number | null;
  max_hours_per_week?: number | null;
  salary_min?: number | null;
  salary_max?: number | null;
  deadline?: ISODateString | null;
}

export type JobUpdate = Partial<JobCreate> & {
  is_active?: boolean;
};

export interface Application {
  id: number;
  job_id: number;
  applicant_id: number;
  resume_id?: number | null;
  cover_letter?: string | null;
  status: ApplicationStatus;
  applied_at: ISODateString;
  updated_at?: ISODateString | null;
  message?: string | null;
}

export interface RecruiterApplication extends Application {
  applicant_name: string;
  applicant_email?: string | null;
  resume_name?: string | null;
}

export interface ApplicationDetail extends Application {
  resume_name?: string | null;
  job_title: string;
  company_name: string;
  location: string;
  category: string;
  job_type: JobType;
  job_schedule: JobSchedule;
}

export interface ApplicationInput {
  resume_id?: number | null;
  cover_letter?: string | null;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  is_read: boolean;
  created_at: ISODateString;
  reference_id?: number | null;
  reference_type?: string | null;
}

export interface NotificationList {
  total_count: number;
  unread_count: number;
  notifications: Notification[];
}

export interface InterviewMessage {
  role: InterviewRole;
  content: string;
}

export interface InterviewSessionSummary {
  id: number;
  job_id: number;
  job_title: string;
  company_name: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface InterviewSession extends InterviewSessionSummary {
  messages: InterviewMessage[];
}

export interface AnalyticsPoint {
  period: ISODateString;
  count: number;
}

export interface AnalyticsResponse {
  start_date: ISODateString;
  end_date: ISODateString;
  group_by: AnalyticsGranularity;
  points: AnalyticsPoint[];
  [key: string]: unknown;
}
