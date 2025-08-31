import axios from 'axios'
import type { 
  WeChatAccount, 
  Article, 
  Summary, 
  TaskLog, 
  ApiResponse, 
  PaginatedResponse 
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Request interceptor
api.interceptors.request.use((config) => {
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// Accounts API
export const accountsApi = {
  getAll: () => api.get<ApiResponse<WeChatAccount[]>>('/accounts'),
  getById: (id: string) => api.get<ApiResponse<WeChatAccount>>(`/accounts/${id}`),
  create: (data: Partial<WeChatAccount>) => api.post<ApiResponse<WeChatAccount>>('/accounts', data),
  update: (id: string, data: Partial<WeChatAccount>) => api.put<ApiResponse<WeChatAccount>>(`/accounts/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<void>>(`/accounts/${id}`),
}

// Articles API
export const articlesApi = {
  getAll: (params?: { page?: number; limit?: number; accountId?: string }) => 
    api.get<PaginatedResponse<Article>>('/articles', { params }),
  getById: (id: string) => api.get<ApiResponse<Article>>(`/articles/${id}`),
  fetch: (accountId: string, days: number = 1) => 
    api.post<ApiResponse<{ message: string; articles: number }>>(`/articles/fetch/${accountId}`, { days }),
  search: (params: { q?: string; category?: string; sentiment?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Article>>('/articles/search', { params }),
}

// Summaries API
export const summariesApi = {
  getAll: (params?: { page?: number; limit?: number; category?: string; sentiment?: string }) =>
    api.get<PaginatedResponse<Summary>>('/summaries', { params }),
  getByArticleId: (articleId: string) => api.get<ApiResponse<Summary>>(`/summaries/article/${articleId}`),
  create: (articleId: string) => api.post<ApiResponse<Summary>>(`/summaries/create/${articleId}`),
  getStats: () => api.get<ApiResponse<{
    total: number
    recent: number
    sentiment: Record<string, number>
    categories: Array<{ category: string; count: number }>
  }>>('/summaries/stats'),
}

// Tasks API
export const tasksApi = {
  getLogs: (params?: { page?: number; limit?: number; taskType?: string; status?: string }) =>
    api.get<PaginatedResponse<TaskLog>>('/tasks/logs', { params }),
  getStats: () => api.get<ApiResponse<{
    total: number
    recent: number
    byType: Record<string, number>
    byStatus: Record<string, number>
  }>>('/tasks/stats'),
  triggerFetch: () => api.post<ApiResponse<{ message: string }>>('/tasks/trigger/fetch'),
  triggerSummarize: () => api.post<ApiResponse<{ message: string }>>('/tasks/trigger/summarize'),
}

export default api
