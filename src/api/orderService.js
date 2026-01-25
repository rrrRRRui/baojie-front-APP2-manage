import axios from 'axios';

// ==========================================
// 1. axios 实例配置 (以后改这里连接后端)
// ==========================================
const service = axios.create({
  // baseURL: 'http://localhost:8080/api', // TODO: 后端接口地址填在这里
  timeout: 5000
});

// ==========================================
// 2. 接口定义 (Mock 模拟数据模式)
// ==========================================

/**
 * 获取工单详情
 * @param {String} orderId 工单号
 */
export const getOrderDetailApi = (orderId) => {
  // --- 真实模式 (以后解开这行注释) ---
  // return service.get(`/worker-li/orders/${orderId}`);

  // --- 模拟模式 (Mock) ---
  return new Promise((resolve) => {
    console.log(`[API] 正在请求工单详情: ${orderId}`);
    setTimeout(() => {
      resolve({
        code: 200,
        data: {
          id: orderId,
          projectName: 'worker-li', // 项目标识
          area: '行政楼 - 302 会议室',
          task: '深度保洁（地面+窗户）',
          level: '加急',
          status: 'PENDING' // PENDING, WORKING, DONE
        }
      });
    }, 500);
  });
};

/**
 * 提交接单 / 到场动作
 * @param {String} orderId 工单号
 * @param {String} action 类型: RECEIVE(接单) | ARRIVE(到场)
 */
export const updateOrderActionApi = (orderId, action) => {
  // --- 真实模式 ---
  // return service.post(`/worker-li/orders/action`, { orderId, action });

  // --- 模拟模式 ---
  return new Promise((resolve) => {
    console.log(`[API] 提交动作: ${action}`);
    setTimeout(() => {
      resolve({ code: 200, msg: '操作成功' });
    }, 600);
  });
};

/**
 * 提交完工确认
 * @param {Object} data 包含图片和确认信息的对象
 */
export const completeOrderApi = (data) => {
  // --- 真实模式 ---
  // return service.post(`/worker-li/orders/complete`, data);

  // --- 模拟模式 ---
  return new Promise((resolve) => {
    console.log(`[API] 提交完工数据:`, data);
    setTimeout(() => {
      // 模拟返回一个追溯码
      resolve({ 
        code: 200, 
        traceCode: 'TRACE-' + Date.now().toString().slice(-6) 
      });
    }, 1000);
  });
};