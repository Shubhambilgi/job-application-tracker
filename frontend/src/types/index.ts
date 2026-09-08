export type Role = "user" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export type ApplicationStatus =
  | "applied"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn";

export interface Application {
  id: number;
  user_id: number;
  company_name: string;
  job_title: string;
  job_link?: string;
  status: ApplicationStatus;
  applied_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type InterviewMode = "online" | "offline" | "phone";
export type InterviewStatus = "scheduled" | "completed" | "cancelled";

export interface Interview {
  id: number;
  application_id: number;
  round_name: string;
  interview_date: string;
  mode: InterviewMode;
  status: InterviewStatus;
  notes?: string;
}
