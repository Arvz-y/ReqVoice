import { SystemUnderStudy, InterviewSession, InterviewGuide, InterviewQuestion } from '../types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = `Request failed (${response.status})`;
    try {
      const err = await response.json();
      if (err.error) errMsg = err.error;
    } catch {}
    throw new Error(errMsg);
  }

  return response.json();
}

export const api = {
  auth: {
    me: () => request<{ user: any }>('/api/auth/me'),
    login: (usernameOrEmail: string, password?: string) =>
      request<{ success: boolean; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password }),
      }),
    register: (data: {
      name: string;
      username: string;
      email: string;
      password: string;
      role?: string;
      department?: string;
    }) =>
      request<{ success: boolean; user: any }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: () =>
      request<{ success: boolean }>('/api/auth/logout', {
        method: 'POST',
      }),
    updateProfile: (data: {
      name?: string;
      username?: string;
      department?: string;
      role?: string;
      avatarUrl?: string;
      bio?: string;
    }) =>
      request<{ success: boolean; user: any }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    completeTutorial: () =>
      request<{ success: boolean }>('/api/auth/tutorial-completed', {
        method: 'POST',
      }),
  },
  systems: {
    list: () => request<{ systems: SystemUnderStudy[] }>('/api/systems'),
    create: (data: Partial<SystemUnderStudy>) =>
      request<{ system: SystemUnderStudy }>('/api/systems', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  guides: {
    list: (systemId?: string) =>
      request<{ guides: InterviewGuide[] }>(`/api/guides${systemId ? `?systemId=${systemId}` : ''}`),
  },
  interviews: {
    list: (systemId?: string) =>
      request<{ interviews: InterviewSession[] }>(`/api/interviews${systemId ? `?systemId=${systemId}` : ''}`),
    get: (id: string) => request<{ interview: InterviewSession }>(`/api/interviews/${id}`),
    create: (data: {
      systemId: string;
      intervieweeName: string;
      intervieweeRole: string;
      intervieweeEmail?: string;
      intervieweeDept?: string;
      questions: Partial<InterviewQuestion>[];
    }) =>
      request<{ interview: InterviewSession }>('/api/interviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    generateAILink: (id: string) =>
      request<{
        success: boolean;
        shareUrl: string;
        shareToken: string;
        interviewerBrief: { name: string; role: string; department: string };
        interviewee: { name: string; role: string };
        questionsCount: number;
        generatedAt: string;
      }>(`/api/interviews/${id}/generate-ai-link`, {
        method: 'POST',
      }),
    saveResponse: (
      id: string,
      data: {
        questionId: string;
        responseText: string;
        audioDurationSeconds?: number;
        videoRecording?: any;
        aiTranscript?: any;
      }
    ) =>
      request<{ success: boolean; response: any }>(`/api/interviews/${id}/response`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    finish: (id: string) =>
      request<{ interview: InterviewSession; summaryReport: any }>(`/api/interviews/${id}/finish`, {
        method: 'POST',
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/interviews/${id}`, {
        method: 'DELETE',
      }),
  },
  share: {
    getPublicInterview: (token: string) =>
      request<{
        id: string;
        systemId: string;
        systemName: string;
        systemDescription?: string;
        interviewer: { name: string; role: string; department: string };
        interviewee: { name: string; role: string };
        questions: InterviewQuestion[];
        responses: Record<string, any>;
      }>(`/api/share/${token}`),
    submitAnswer: (
      token: string,
      data: {
        questionId: string;
        responseText: string;
        audioDurationSeconds?: number;
        videoRecording?: any;
        aiTranscript?: any;
      }
    ) =>
      request<{ success: boolean; response: any; isComplete: boolean }>(`/api/share/${token}/submit`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
  gemini: {
    transcribeVideo: (data: {
      base64Media?: string;
      mimeType?: string;
      questionText: string;
      category?: string;
      durationSeconds?: number;
    }) =>
      request<{
        transcript: string;
        confidence: number;
        sentiment: 'positive' | 'neutral' | 'negative' | 'constructive';
        sentimentScore: number;
        keyRequirements: string[];
        modelUsed: string;
        generatedAt: string;
      }>('/api/gemini/transcribe-video', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    analyzeResponse: (data: {
      text: string;
      questionText?: string;
      category?: string;
      speakerRole?: string;
    }) =>
      request<{
        sentiment: 'positive' | 'neutral' | 'negative' | 'constructive';
        sentimentScore: number;
        sentimentTone: string;
        confidence: number;
        keyRequirements: string[];
        urgency: 'High' | 'Medium' | 'Low';
        analyzedAt: string;
      }>('/api/gemini/analyze-response', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    suggestQuestions: (data: { systemName: string; systemType?: string; role?: string; prompt?: string; count?: number }) =>
      request<{ questions: InterviewQuestion[] }>('/api/gemini/suggest-questions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    generateGuide: (data: { systemName: string; role: string }) =>
      request<{ guide: InterviewGuide }>('/api/gemini/generate-guide', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    realtimeCopilot: (data: { questionText: string; currentAnswer: string; category: string }) =>
      request<{
        suggestedFollowUp: string;
        clarifyingProbe: string;
        requirementTag: string;
      }>('/api/gemini/realtime-copilot', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    crossCompare: (systemId: string, interviewIds?: string[]) =>
      request<{ comparison: any }>('/api/gemini/cross-compare', {
        method: 'POST',
        body: JSON.stringify({ systemId, interviewIds }),
      }),
  },
  database: {
    getStats: () => request<any>('/api/database/stats'),
    getMysqlSchema: () =>
      fetch('/api/database/mysql-schema').then((r) => r.text()),
    downloadMysqlDumpUrl: '/api/database/mysql-dump',
    downloadSingleReportUrl: '/api/database/export-single-report',
  },
};
