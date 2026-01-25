import type { WorkOrder } from '@/types'

// 生成模拟工单数据
export const mockWorkOrders: WorkOrder[] = [
  {
    id: '1',
    orderNo: 'WO202401001',
    title: '办公区域日常清洁',
    description: '对办公区域进行日常清洁，包括地面清扫、桌面擦拭、垃圾清理等',
    type: 'daily',
    status: 'completed',
    priority: 'medium',
    location: 'A栋3楼办公区',
    assignee: '张三',
    assigneeId: 'user001',
    reporter: '李经理',
    reporterId: 'user101',
    createdAt: '2024-01-15 09:00:00',
    updatedAt: '2024-01-15 11:30:00',
    scheduledAt: '2024-01-15 10:00:00',
    completedAt: '2024-01-15 11:30:00',
    estimatedDuration: 120,
    actualDuration: 150,
    images: [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2',
      'https://picsum.photos/400/300?random=3'
    ],
    tags: ['日常清洁', '办公区'],
    remarks: '清洁完成，质量良好'
  },
  {
    id: '2',
    orderNo: 'WO202401002',
    title: '会议室深度清洁',
    description: '会议室需要进行深度清洁，包括地毯清洗、玻璃擦拭、空调清洁等',
    type: 'deep',
    status: 'processing',
    priority: 'high',
    location: 'B栋2楼会议室',
    assignee: '王五',
    assigneeId: 'user002',
    reporter: '陈主任',
    reporterId: 'user102',
    createdAt: '2024-01-16 08:30:00',
    updatedAt: '2024-01-16 10:15:00',
    scheduledAt: '2024-01-16 14:00:00',
    estimatedDuration: 180,
    images: [
      'https://picsum.photos/400/300?random=4',
      'https://picsum.photos/400/300?random=5'
    ],
    tags: ['深度清洁', '会议室'],
    remarks: '正在进行中，预计下午完成'
  },
  {
    id: '3',
    orderNo: 'WO202401003',
    title: '卫生间维护清洁',
    description: '卫生间设施维护和清洁，包括马桶疏通、地面消毒、补充用品等',
    type: 'maintenance',
    status: 'pending',
    priority: 'urgent',
    location: 'C栋1楼卫生间',
    assignee: '赵六',
    assigneeId: 'user003',
    reporter: '物业管理',
    reporterId: 'user103',
    createdAt: '2024-01-17 07:45:00',
    updatedAt: '2024-01-17 07:45:00',
    scheduledAt: '2024-01-17 09:00:00',
    estimatedDuration: 90,
    images: [
      'https://picsum.photos/400/300?random=6'
    ],
    tags: ['维护', '卫生间', '紧急'],
    remarks: '马桶堵塞，需要紧急处理'
  },
  {
    id: '4',
    orderNo: 'WO202401004',
    title: '食堂紧急清洁',
    description: '食堂发生意外污染，需要紧急清洁和消毒处理',
    type: 'emergency',
    status: 'completed',
    priority: 'urgent',
    location: 'D栋1楼食堂',
    assignee: '孙七',
    assigneeId: 'user004',
    reporter: '食堂经理',
    reporterId: 'user104',
    createdAt: '2024-01-14 12:30:00',
    updatedAt: '2024-01-14 15:20:00',
    scheduledAt: '2024-01-14 13:00:00',
    completedAt: '2024-01-14 15:20:00',
    estimatedDuration: 120,
    actualDuration: 170,
    images: [
      'https://picsum.photos/400/300?random=7',
      'https://picsum.photos/400/300?random=8',
      'https://picsum.photos/400/300?random=9',
      'https://picsum.photos/400/300?random=10'
    ],
    tags: ['紧急清洁', '食堂', '消毒'],
    remarks: '紧急处理完成，已恢复正常使用'
  },
  {
    id: '5',
    orderNo: 'WO202401005',
    title: '停车场清洁',
    description: '地下停车场清洁，包括地面清洗、垃圾清理、标识维护等',
    type: 'daily',
    status: 'cancelled',
    priority: 'low',
    location: '地下停车场',
    assignee: '周八',
    assigneeId: 'user005',
    reporter: '保安队长',
    reporterId: 'user105',
    createdAt: '2024-01-13 16:00:00',
    updatedAt: '2024-01-13 17:30:00',
    scheduledAt: '2024-01-14 08:00:00',
    estimatedDuration: 240,
    images: [],
    tags: ['停车场', '日常清洁'],
    remarks: '因设备故障取消，改期执行'
  }
]

// 生成更多模拟数据
const generateMoreMockData = (): WorkOrder[] => {
  const locations = ['A栋1楼', 'A栋2楼', 'A栋3楼', 'B栋1楼', 'B栋2楼', 'C栋1楼', 'C栋2楼', 'D栋1楼']
  const assignees = [
    { name: '张三', id: 'user001' },
    { name: '李四', id: 'user002' },
    { name: '王五', id: 'user003' },
    { name: '赵六', id: 'user004' },
    { name: '孙七', id: 'user005' }
  ]
  const types: WorkOrder['type'][] = ['daily', 'deep', 'maintenance', 'emergency']
  const statuses: WorkOrder['status'][] = ['pending', 'processing', 'completed', 'cancelled']
  const priorities: WorkOrder['priority'][] = ['low', 'medium', 'high', 'urgent']

  const additionalOrders: WorkOrder[] = []

  for (let i = 6; i <= 50; i++) {
    const assignee = assignees[Math.floor(Math.random() * assignees.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    const location = locations[Math.floor(Math.random() * locations.length)]
    
    const createdDate = new Date(2024, 0, Math.floor(Math.random() * 30) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))
    const scheduledDate = new Date(createdDate.getTime() + Math.random() * 24 * 60 * 60 * 1000)
    
    const order: WorkOrder = {
      id: i.toString(),
      orderNo: `WO2024${i.toString().padStart(5, '0')}`,
      title: `${type === 'daily' ? '日常清洁' : type === 'deep' ? '深度清洁' : type === 'maintenance' ? '维护清洁' : '紧急清洁'} - ${location}`,
      description: `${location}区域清洁工作`,
      type,
      status,
      priority,
      location,
      assignee: assignee.name,
      assigneeId: assignee.id,
      reporter: '系统管理员',
      reporterId: 'admin',
      createdAt: createdDate.toISOString().replace('T', ' ').slice(0, 19),
      updatedAt: createdDate.toISOString().replace('T', ' ').slice(0, 19),
      scheduledAt: scheduledDate.toISOString().replace('T', ' ').slice(0, 19),
      estimatedDuration: Math.floor(Math.random() * 180) + 60,
      images: Array.from({ length: Math.floor(Math.random() * 4) }, (_, idx) => 
        `https://picsum.photos/400/300?random=${i * 10 + idx}`
      ),
      tags: [type === 'daily' ? '日常' : type === 'deep' ? '深度' : type === 'maintenance' ? '维护' : '紧急'],
      remarks: status === 'completed' ? '已完成' : status === 'cancelled' ? '已取消' : ''
    }

    if (status === 'completed') {
      const completedDate = new Date(scheduledDate.getTime() + (order.estimatedDuration + Math.floor(Math.random() * 60 - 30)) * 60 * 1000)
      order.completedAt = completedDate.toISOString().replace('T', ' ').slice(0, 19)
      order.actualDuration = order.estimatedDuration + Math.floor(Math.random() * 60 - 30)
    }

    additionalOrders.push(order)
  }

  return additionalOrders
}

// 导出完整的模拟数据
export const allMockWorkOrders = [...mockWorkOrders, ...generateMoreMockData()]