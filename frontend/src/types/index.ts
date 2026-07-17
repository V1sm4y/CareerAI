export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export type ApplicationStatus =
  | 'Applied'
  | 'OA Scheduled'
  | 'Interview'
  | 'Rejected'
  | 'Offer'
  | 'Accepted';

export interface JobApplication {
  id: number;
  company_name: string;
  role: string;
  date_applied: string;
  status: ApplicationStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  owner_id: number;
}

export interface ApplicationCreate {
  company_name: string;
  role: string;
  date_applied: string;
  status: ApplicationStatus;
  notes?: string;
}

export interface DashboardStats {
  total: number;
  by_status: Record<string, number>;
  recent: Array<{
    id: number;
    company_name: string;
    role: string;
    status: string;
    date_applied: string;
  }>;
}

export interface Resume {
  id: number;
  filename: string;
  original_filename: string;
  file_size?: number;
  ai_score?: number;
  ai_recommendations?: string;
  uploaded_at: string;
  analyzed_at?: string;
  owner_id: number;
}

export interface AnalysisResult {
  score: number;
  grade: string;
  recommendations: string[];
  strengths: string[];
  word_count: number;
  sections_found: string[];
}
