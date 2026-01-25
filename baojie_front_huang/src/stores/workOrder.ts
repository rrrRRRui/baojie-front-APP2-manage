import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WorkOrder, WorkOrderFilter, Statistics } from '@/types'
import { mockWorkOrders } from '@/mock/workOrders'

export const useWorkOrderStore = defineStore('workOrder', () => {
  const workOrders = ref<WorkOrder[]>(mockWorkOrders)
  const loading = ref(false)
  const currentFilter = ref<WorkOrderFilter>({})

  // 筛选后的工单列表
  const filteredWorkOrders = computed(() => {
    let result = workOrders.value

    const filter = currentFilter.value

    // 关键词搜索
    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase()
      result = result.filter(order => 
        order.title.toLowerCase().includes(keyword) ||
        order.orderNo.toLowerCase().includes(keyword) ||
        order.location.toLowerCase().includes(keyword) ||
        order.assignee.toLowerCase().includes(keyword)
      )
    }

    // 状态筛选
    if (filter.status && filter.status.length > 0) {
      result = result.filter(order => filter.status!.includes(order.status))
    }

    // 类型筛选
    if (filter.type && filter.type.length > 0) {
      result = result.filter(order => filter.type!.includes(order.type))
    }

    // 优先级筛选
    if (filter.priority && filter.priority.length > 0) {
      result = result.filter(order => filter.priority!.includes(order.priority))
    }

    // 负责人筛选
    if (filter.assigneeId) {
      result = result.filter(order => order.assigneeId === filter.assigneeId)
    }

    // 地点筛选
    if (filter.location) {
      result = result.filter(order => order.location.includes(filter.location!))
    }

    // 日期范围筛选
    if (filter.dateRange && filter.dateRange.length === 2) {
      const [startDate, endDate] = filter.dateRange
      result = result.filter(order => {
        const orderDate = order.createdAt.split(' ')[0]
        return orderDate >= startDate && orderDate <= endDate
      })
    }

    return result
  })

  // 统计数据
  const statistics = computed((): Statistics => {
    const orders = filteredWorkOrders.value
    const total = orders.length
    const pending = orders.filter(o => o.status === 'pending').length
    const processing = orders.filter(o => o.status === 'processing').length
    const completed = orders.filter(o => o.status === 'completed').length
    const cancelled = orders.filter(o => o.status === 'cancelled').length
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0
    
    const completedOrders = orders.filter(o => o.status === 'completed' && o.actualDuration)
    const avgDuration = completedOrders.length > 0 
      ? completedOrders.reduce((sum, o) => sum + (o.actualDuration || 0), 0) / completedOrders.length
      : 0

    return {
      total,
      pending,
      processing,
      completed,
      cancelled,
      completionRate: Math.round(completionRate * 100) / 100,
      avgDuration: Math.round(avgDuration)
    }
  })

  // 设置筛选条件
  const setFilter = (filter: WorkOrderFilter) => {
    currentFilter.value = { ...filter }
  }

  // 获取工单详情
  const getWorkOrderById = (id: string): WorkOrder | undefined => {
    return workOrders.value.find(order => order.id === id)
  }

  // 更新工单状态
  const updateWorkOrderStatus = async (id: string, status: WorkOrder['status']) => {
    loading.value = true
    try {
      const order = workOrders.value.find(o => o.id === id)
      if (order) {
        order.status = status
        order.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19)
        if (status === 'completed') {
          order.completedAt = order.updatedAt
          // 模拟实际耗时
          order.actualDuration = order.estimatedDuration + Math.floor(Math.random() * 60 - 30)
        }
      }
    } finally {
      loading.value = false
    }
  }

  // 删除工单
  const deleteWorkOrder = async (id: string) => {
    loading.value = true
    try {
      const index = workOrders.value.findIndex(o => o.id === id)
      if (index > -1) {
        workOrders.value.splice(index, 1)
      }
    } finally {
      loading.value = false
    }
  }

  return {
    workOrders,
    filteredWorkOrders,
    loading,
    currentFilter,
    statistics,
    setFilter,
    getWorkOrderById,
    updateWorkOrderStatus,
    deleteWorkOrder
  }
})