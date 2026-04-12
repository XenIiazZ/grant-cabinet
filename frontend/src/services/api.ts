import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Флаг для предотвращения бесконечного цикла обновления
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Функция для подписки на обновление токена
const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

// Функция для уведомления всех подписчиков о новом токене
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Интерцептор для обработки 401 ошибок и обновления токена
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Если это не 401 или уже пробовали обновить - отклоняем
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Если это запрос на обновление токена и он тоже 401 - разлогиниваем
    if (originalRequest.url?.includes('/auth/refresh')) {
      localStorage.clear();
      window.location.href = '/';
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Пытаемся обновить токен
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { access_token, refresh_token } = response.data;
        
        // Сохраняем новые токены
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        
        // Обновляем заголовок для исходного запроса
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        // Уведомляем все ожидающие запросы
        onRefreshed(access_token);
        
        // Повторяем исходный запрос
        return api(originalRequest);
      } catch (refreshError) {
        // Если не удалось обновить - очищаем все и редирект на логин
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Если уже идет обновление, подписываемся на новое событие
    return new Promise((resolve) => {
      subscribeTokenRefresh((token: string) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        resolve(api(originalRequest));
      });
    });
  }
);

// Типы
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
  role: string;
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
  role: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

// API методы
export const apiService = {
  auth: {
    login: (email: string, password: string) =>
      api.post<TokenResponse>('/auth/login', { email, password }),
    
    register: (email: string, password: string, full_name: string) =>
      api.post<UserResponse>('/auth/register', { email, password, full_name }),
    
    getMe: () => api.get<UserResponse>('/auth/me'),
    
    refreshToken: (refresh_token: string) =>
      api.post<TokenResponse>('/auth/refresh', { refresh_token }),
    
    logout: (refresh_token: string) =>
      api.post('/auth/logout', { refresh_token }),
    
    logoutAll: () => api.post('/auth/logout-all'),
    
    clientLogout: () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {});
      }
      localStorage.clear();
    },
  },

  grants: {
    getAll: (params?: { category?: string; status?: string; min_amount?: number; max_amount?: number; search?: string; sort_by?: string; sort_order?: string; page?: number; page_size?: number }) => 
      api.get<Grant[]>('/grants/', { params }),
    getById: (id: number) => api.get<Grant>(`/grants/${id}`),
    create: (data: any) => api.post<Grant>('/grants/', data),
    update: (id: number, data: any) => api.put<Grant>(`/grants/${id}`, data),
    delete: (id: number) => api.delete(`/grants/${id}`),
  },

  applications: {
    getMyApplications: () => api.get<Application[]>('/applications/my'),
    getApplicationById: (id: number) => api.get<Application>(`/applications/${id}`),
    createApplication: (data: any) => api.post<Application>('/applications/', data),
    updateApplication: (id: number, data: any) => api.put<Application>(`/applications/${id}`, data),
    deleteApplication: (id: number) => api.delete(`/applications/${id}`),
    submitApplication: (id: number) => api.post<Application>(`/applications/${id}/submit`),
    updateFeedback: (id: number, feedback: string) => 
      api.patch(`/applications/${id}/feedback`, { feedback }),
    updateStatus: (id: number, status: string) => 
      api.patch(`/applications/${id}/status`, { status }),
  },

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

  admin: {
    getUsers: () => api.get<User[]>('/admin/users'),
    getApplications: () => api.get<any[]>('/admin/applications'),
    toggleUserStatus: (userId: number, isActive: boolean) => 
      api.patch(`/admin/users/${userId}/status`, { status: isActive ? 'active' : 'blocked' }),
    changeUserRole: (userId: number, role: 'user' | 'admin') => 
      api.patch(`/admin/users/${userId}/role`, { role }),
    deleteUser: (userId: number) => api.delete(`/admin/users/${userId}`),
    getStats: () => api.get('/admin/stats'),
  },

  
  files: {
    uploadFile: (applicationId: number, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.post(`/applications/${applicationId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    getFile: (fileId: number) => api.get(`/files/${fileId}`),
    deleteFile: (fileId: number) => api.delete(`/files/${fileId}`),
    getApplicationFiles: (applicationId: number) => api.get(`/applications/${applicationId}/files`)
  },
};

export default api;