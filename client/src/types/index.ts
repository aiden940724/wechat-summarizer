export interface WeChatAccount {
  id: string
  name: string
  displayName: string
  description?: string
  isActive: boolean
  lastFetched?: string
  createdAt: string
  updatedAt: string
  _count?: {
    articles: number
  }
}

export interface Article {
  id: string
  title: string
  content: string
  url: string
  publishDate: string
  author?: string
  readCount?: number
  likeCount?: number
  accountId: string
  account?: WeChatAccount
  summary?: Summary
  createdAt: string
  updatedAt: string
}

export interface Summary {
  id: string
  content: string
  keyPoints: string // JSON string that will be parsed to string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  category: string
  articleId: string
  article?: Article
  createdAt: string
  updatedAt: string
}

export interface TaskLog {
  id: string
  taskType: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  message?: string
  startTime: string
  endTime?: string
  duration?: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
