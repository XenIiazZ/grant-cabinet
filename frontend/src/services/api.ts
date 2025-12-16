import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерцептор для ошибок
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Типы для фронтенда
export interface Grant {
  id: number;
  title: string;
  organization: string;
  description: string;
  max_amount: string;
  budget_example?: string;
  deadline: string;
  category: string;
  status: 'открыт' | 'скоро_закрывается' | 'закрыт';
  applicants_count: number;
  created_by: number;
}

export interface Application {
  id: number;
  project_title: string;
  grant_id: number;
  user_id: number;
  project_description: string;
  budget_justification?: string;
  timeline?: string;
  status: 'черновик' | 'на_рассмотрении' | 'одобрено' | 'отклонено' | 'требует_доработки';
  feedback?: string;
  ml_evaluation?: MLEvaluation;
  created_at: string;
  updated_at: string;
  grant_title?: string;
  grant_organization?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
}

export interface MLEvaluation {
  overall_score: number;
  overall_label: string;
  summary: string;
  recommendation: string;
  criteria_evaluations: CriteriaEvaluation[];
  priority_recommendations: string[];
  word_count: number;
}

export interface CriteriaEvaluation {
  criterion_name: string;
  score: number;
  label: string;
  explanation: string;
  recommendation: string;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// API методы
export const apiService = {
  // Авторизация
  auth: {
    login: (email: string, password: string) =>
      api.post<TokenResponse>('/auth/login', { email, password }),
    
    register: (email: string, password: string, full_name: string) =>
      api.post<UserResponse>('/auth/register', { email, password, full_name }),
    
    getMe: () => api.get<UserResponse>('/auth/me'),
    
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },

  // Гранты
  grants: {
    getAll: () => api.get<Grant[]>('/grants'),
    getById: (id: number) => api.get<Grant>(`/grants/${id}`),
    create: (data: any) => api.post<Grant>('/grants', data),
  },

  // Заявки
  applications: {
    getMyApplications: () => api.get<Application[]>('/applications/my'),
    getApplicationById: (id: number) => api.get<Application>(`/applications/${id}`),
    createApplication: (data: any) => api.post<Application>('/applications', data),
    updateApplication: (id: number, data: any) => api.put<Application>(`/applications/${id}`, data),
    deleteApplication: (id: number) => api.delete(`/applications/${id}`),
    submitApplication: (id: number) => api.post<Application>(`/applications/${id}/submit`),
  },

  // ML оценка
  ml: {
    evaluate: (application_text: string, grant_title?: string) =>
      api.post<MLEvaluation>('/ai/evaluate', {
        application_text,
        grant_title: grant_title || '',
        grant_category: 'general',
      }),
    
    quickEvaluate: (application_text: string) =>
      api.post<any>('/ai/quick-evaluate', { application_text }),
    
    getModelInfo: () => api.get('/ai/model-info'),
    
    debugAnalysis: (application_text: string) =>
      api.post('/ai/debug-analysis', { application_text }),
  },
};

export default api;