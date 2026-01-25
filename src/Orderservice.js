// src/services/OrderService.js

// --- 模拟数据库数据 ---
let orders = [
  { 
    id: 101, 
    customerName: '张先生', 
    phone: '13800138000', 
    address: '幸福小区 1栋 302', 
    time: '2023-10-20 14:00',
    status: 'PENDING', 
    requirements: { tags: ['深度清洁'], note: '' },
    cleanerId: null,
    cleanerName: ''
  },
  { 
    id: 102, 
    customerName: '王女士', 
    phone: '13912345678', 
    address: '科技园 A座 1001', 
    time: '2023-10-21 09:00',
    status: 'ASSIGNED', 
    requirements: { tags: ['擦玻璃', '除螨'], note: '自带工具' },
    cleanerId: 1,
    cleanerName: '李阿姨'
  }
];

let cleaners = [
  { id: 1, name: '李阿姨', status: 'BUSY', skills: ['日常保洁', '擦玻璃'] },
  { id: 2, name: '赵师傅', status: 'IDLE', skills: ['开荒保洁', '家电清洗'] },
  { id: 3, name: '孙大姐', status: 'IDLE', skills: ['日常保洁', '做饭'] },
];

let nextOrderId = 103;

// --- 简单的观察者模式（模拟 Socket 实时通知）---
// 这样当我们在 Service 里修改数据时，可以主动通知前端组件
const listeners = [];
const notifyListeners = () => {
  listeners.forEach(cb => cb());
};

export default {
  // 订阅数据变化（模拟 Socket.on）
  onDataChange(callback) {
    listeners.push(callback);
  },

  // 1. 获取所有工单
  async getOrders() {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 返回数据的深拷贝，防止前端直接修改源数据
        resolve(JSON.parse(JSON.stringify(orders)).reverse());
      }, 300); // 模拟 300ms 网络延迟
    });
  },

  // 2. 获取保洁员列表
  async getCleaners() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(JSON.parse(JSON.stringify(cleaners)));
      }, 300);
    });
  },

  // 3. 创建工单
  async createOrder(orderData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newOrder = {
          id: nextOrderId++,
          ...orderData,
          status: 'PENDING',
          cleanerId: null,
          cleanerName: ''
        };
        orders.push(newOrder);
        notifyListeners(); // 模拟广播：有新数据了！
        resolve(newOrder);
      }, 500);
    });
  },

  // 4. 派单
  async dispatchOrder(orderId, cleanerId) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const orderIndex = orders.findIndex(o => o.id === orderId);
        const cleanerIndex = cleaners.findIndex(c => c.id === cleanerId);

        if (orderIndex === -1 || cleanerIndex === -1) {
          reject('数据不存在');
          return;
        }

        // 修改数据状态
        const cleanerName = cleaners[cleanerIndex].name;
        
        orders[orderIndex].status = 'ASSIGNED';
        orders[orderIndex].cleanerId = cleanerId;
        orders[orderIndex].cleanerName = cleanerName;
        
        cleaners[cleanerIndex].status = 'BUSY';

        notifyListeners(); // 模拟广播：状态更新了！
        resolve({ success: true });
      }, 400);
    });
  }
};