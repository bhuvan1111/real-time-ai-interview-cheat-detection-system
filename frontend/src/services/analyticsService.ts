import { api } from './api';
import { AnalyticsOverview, SessionAnalyticsDetail } from '../types';

export const analyticsService = {
  async getOverview(): Promise<AnalyticsOverview> {
    const res = await api.get<AnalyticsOverview>('/analytics/overview');
    return res.data;
  },

  async getSessionDetail(sessionId: number): Promise<SessionAnalyticsDetail> {
    const res = await api.get<SessionAnalyticsDetail>(`/analytics/session/${sessionId}`);
    return res.data;
  }
};
