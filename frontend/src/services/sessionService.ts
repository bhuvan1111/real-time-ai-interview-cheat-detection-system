import { api } from './api';
import { AssessmentSession, MonitoringEvent, Submission, SimilarityResultResponse } from '../types';

export const sessionService = {
  async startSession(assessmentId: number): Promise<AssessmentSession> {
    const res = await api.post<AssessmentSession>('/sessions', { assessment_id: assessmentId });
    return res.data;
  },

  async getSessions(status?: string, assessmentId?: number): Promise<AssessmentSession[]> {
    const res = await api.get<AssessmentSession[]>('/sessions', {
      params: { status, assessment_id: assessmentId }
    });
    return res.data;
  },

  async getSession(id: number): Promise<AssessmentSession> {
    const res = await api.get<AssessmentSession>(`/sessions/${id}`);
    return res.data;
  },

  async finishSession(id: number): Promise<AssessmentSession> {
    const res = await api.post<AssessmentSession>(`/sessions/${id}/finish`, { status: 'completed' });
    return res.data;
  },

  async recordEvent(event: Partial<MonitoringEvent>): Promise<MonitoringEvent> {
    const res = await api.post<MonitoringEvent>('/events', event);
    return res.data;
  },

  async getSessionEvents(sessionId: number): Promise<MonitoringEvent[]> {
    const res = await api.get<MonitoringEvent[]>(`/sessions/${sessionId}/events`);
    return res.data;
  },

  async submitCode(sessionId: number, questionId: number, code: string, language: string = 'python'): Promise<Submission> {
    const res = await api.post<Submission>('/submissions', {
      session_id: sessionId,
      question_id: questionId,
      code,
      language
    });
    return res.data;
  },

  async runCode(code: string, language: string = 'python', inputData: string = ''): Promise<{ output: string; error?: string; execution_time_ms: number }> {
    const res = await api.post('/submissions/run', {
      code,
      language,
      input_data: inputData
    });
    return res.data;
  },

  async getSimilarityAnalysis(submissionId: number): Promise<SimilarityResultResponse> {
    const res = await api.get<SimilarityResultResponse>(`/similarity/${submissionId}`);
    return res.data;
  }
};
