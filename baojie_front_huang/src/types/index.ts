// 工单状态
export type WorkOrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled'

// 工单优先级
export type Priority = 'low' | 'medium' | 'high' | 'urgent'

// 工单类型
export type WorkOrderType = 'daily' | 'deep' | 'maintenance' | 'emergency'

// 工单数据结构
export interface WorkOrder {
  id: string
  orderNo: string
  title: string
  description: string
  type: WorkOrderType
  status: WorkOrderStatus
  priority: Priority
  location: string
  assignee: string
  assigneeId: string
  reporter: string
  reporterId: string
  createdAt: string
  updatedAt: string
  scheduledAt: string
  completedAt?: string
  estimatedDuration: number // 预计耗时（分钟）
  actualDuration?: number // 实际耗时（分钟）
  images: string[] // 证据图片URLs
  tags: string[]
  remarks?: string
}

// 筛选条件
export interface WorkOrderFilter {
  keyword?: string
  status?: WorkOrderStatus[]
  type?: WorkOrderType[]
  priority?: Priority[]
  assigneeId?: string
  dateRange?: [string, string]
  location?: string
}

// 统计数据
export interface Statistics {
  total: number
  pending: number
  processing: number
  completed: number
  cancelled: number
  completionRate: number
  avgDuration: number
}

// 报表数据
export interface ReportData {
  date: string
  total: number
  completed: number
  pending: number
  processing: number
  cancelled: number
  completionRate: number
  avgDuration: number
}

// 排行数据
export interface RankingData {
  name: string
  value: number
  percentage: number
}

// 导出选项
export interface ExportOptions {
  type: 'excel' | 'pdf'
  dateRange: [string, string]
  includeImages: boolean
  fields: string[]
}