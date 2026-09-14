export type UserRole = 'candidate' | 'admin';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Question {
  id: number;
  assessment_id: number;
  title: string;
  description: string;
  starter_code: string;
  language: string;
  time_limit: number;
  created_at?: string;
}

export interface Assessment {
  id: number;
  title: string;
  description: string;
  duration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  created_by?: number;
  created_at: string;
  updated_at?: string;
  questions: Question[];
}

export interface MonitoringEvent {
  id?: number;
  session_id: number;
  event_type: string;
  timestamp: string;
  severity: EventSeverity;
  score_contribution: number;
  metadata?: Record<string, any>;
}

export interface AssessmentSession {
  id: number;
  candidate_id: number;
  assessment_id: number;
  started_at: string;
  ended_at?: string | null;
  status: 'active' | 'completed' | 'flagged';
  risk_score: number;
  risk_level: RiskLevel;
  behavior_anomaly_score: number;
  risk_reasons: string[];
  tab_switch_count: number;
  total_hidden_duration: number;
  paste_count: number;
  large_paste_count: number;
  blur_count: number;
  total_blur_duration: number;
  code_similarity_max: number;
  candidate?: User;
  assessment?: Assessment;
  submissions?: Submission[];
  recent_events?: MonitoringEvent[];
}

export interface Submission {
  id: number;
  session_id: number;
  question_id: number;
  code: string;
  language: string;
  submitted_at: string;
}

export interface SimilarityPairResult {
  compared_submission_id?: number;
  candidate_name?: string;
  similarity_score: number;
  token_similarity: number;
  ast_similarity: number;
  method: string;
  explanation: string;
}

export interface SimilarityResultResponse {
  submission_id?: number;
  highest_similarity: number;
  results: SimilarityPairResult[];
  disclaimer: string;
}

export interface AnalyticsOverview {
  total_candidates: number;
  active_sessions: number;
  suspicious_sessions: number;
  critical_risk_sessions: number;
  average_risk_score: number;
  total_events_processed: number;
  risk_level_counts: Record<string, number>;
  event_type_counts: Record<string, number>;
}

export interface RiskTimelinePoint {
  timestamp: string;
  risk_score: number;
  event_type: string;
}

export interface SessionAnalyticsDetail {
  session_id: number;
  candidate_name: string;
  risk_score: number;
  risk_level: RiskLevel;
  total_events: number;
  tab_switches: number;
  large_pastes: number;
  typing_edits: number;
  max_similarity: number;
  anomaly_score: number;
  timeline_risk: RiskTimelinePoint[];
}
