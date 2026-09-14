import { api } from './api';
import { Assessment, Question } from '../types';

export const assessmentService = {
  async getAssessments(): Promise<Assessment[]> {
    const res = await api.get<Assessment[]>('/assessments');
    return res.data;
  },

  async getAssessment(id: number): Promise<Assessment> {
    const res = await api.get<Assessment>(`/assessments/${id}`);
    return res.data;
  },

  async createAssessment(data: Partial<Assessment>): Promise<Assessment> {
    const res = await api.post<Assessment>('/assessments', data);
    return res.data;
  },

  async updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment> {
    const res = await api.put<Assessment>(`/assessments/${id}`, data);
    return res.data;
  },

  async deleteAssessment(id: number): Promise<void> {
    await api.delete(`/assessments/${id}`);
  },

  async addQuestion(question: Partial<Question>): Promise<Question> {
    const res = await api.post<Question>('/questions', question);
    return res.data;
  }
};
