export interface Env {
  // Bindings
  DB: D1Database;
  FORM_SCHEMAS: KVNamespace;
  FORM_ANALYTICS: AnalyticsEngineDataset;

  // Secrets & Config
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  ALLOWED_ADMIN_EMAILS: string; // Comma-separated list
  TURNSTILE_SECRET_KEY?: string; // Optional site verification secret
  TURNSTILE_PUBLIC_KEY?: string; // Optional Turnstile sitekey
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
}

export type SubmissionStatus = 'partial' | 'completed';

export interface Submission {
  id: string;
  form_id: string;
  status: SubmissionStatus;
  answers: string; // JSON string
  created_at: number;
  updated_at: number;
}

export interface FormSchema {
  id: string;
  title: string;
  pages: FormPage[];
  [key: string]: any; // Allow complex conditional logic jumps
}

export interface FormPage {
  id: string;
  title?: string;
  fields: FormField[];
  checkpoint?: boolean; // If true, a partial save is triggered when the user advances past this page
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  description?: string;
  [key: string]: any;
}
