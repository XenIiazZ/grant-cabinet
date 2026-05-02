// src/__tests__/services/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мокаем axios ДО импорта apiService
vi.mock('axios', async () => {
  // Создаём мок-объект для экземпляра axios
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

// Теперь импортируем apiService (axios уже замокан)
import axios from 'axios';
import { apiService } from '../../services/api' ;  

describe('apiService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('auth.login sends correct request', async () => {
    const mockAxiosInstance = (axios as any).create();
    mockAxiosInstance.post.mockResolvedValue({ data: { access_token: 'token', refresh_token: 'refresh' } });

    const result = await apiService.auth.login('test@ex.com', 'pass');
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', { email: 'test@ex.com', password: 'pass' });
    expect(result.data.access_token).toBe('token');
  });

  it('grants.getAll sends request', async () => {
    const mockAxiosInstance = (axios as any).create();
    mockAxiosInstance.get.mockResolvedValue({ data: [] });

    await apiService.grants.getAll();
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/grants/', { params: undefined });
  });
});