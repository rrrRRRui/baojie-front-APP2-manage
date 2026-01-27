import axios from 'axios';
import { showToast } from 'vant';

// ==========================================
// 1. 基础配置
// ==========================================
const service = axios.create({
  // 这里写 '/api' 是为了走 vite.config.js 里的代理，解决跨域问题
  // 如果你还没配好 vite 代理，暂时可以写死: 'http://124.223.16.213:8000'
  baseURL: '/api', 
  timeout: 10000 // 超时时间 10秒
});

// ==========================================
// 2. 请求拦截器：自动带上 Token
// ==========================================
service.interceptors.request.use(
  config => {
    // 截图中的 Token (注意：如果 Token 过期了，记得去 Postman 重新拿一个)
    const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6Inh1ZG9uZyIsInJvbGUiOiJcdTRmZGRcdTZkMDFcdTRlYmFcdTU0NTgiLCJhdmF0YXIiOm51bGwsImV4cCI6MTc3MDA5MTM5N30.SKxET1k5kYBIDC6TA6NAJ1NmD-cqCfwiWy7XqxBdCm8';
    
    config.headers['Authorization'] = token;
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// ==========================================
// 3. 响应拦截器：处理业务逻辑
// ==========================================
service.interceptors.response.use(
  response => {
    // 剥离最外层的 HTTP 响应，只拿 data
    const res = response.data;

    // 情况 A：操作成功 (后端通常返回 200 或 0)
    // 根据你的截图，成功时 status 是 200
    if (res.code === 200 || res.code === 0) {
      return res.data; 
    }

    // 情况 B：业务异常 (例如 code 4002: 无法重复接单)
    // 我们手动创建一个 Error，把 code 带上，让组件自己决定怎么处理
    const error = new Error(res.message || '业务执行异常');
    error.code = res.code; // 关键：把 4002 传出去
    error.data = res.data;
    
    // 如果不是 4002 (静默处理)，其他错误才弹窗
    if (res.code !== 4002) {
      showToast(res.message || '操作失败');
    }

    return Promise.reject(error);
  },
  error => {
    // 情况 C：真正的网络错误 (404, 500, 断网)
    let msg = '网络连接异常';
    if (error.response && error.response.status === 404) {
      msg = '接口地址未找到 (404)';
    } else if (error.message.includes('timeout')) {
      msg = '请求超时，请检查网络';
    }
    showToast(msg);
    return Promise.reject(error);
  }
);

// ==========================================
// 4. API 接口定义 (严格对照你的 Postman)
// ==========================================

/**
 * 获取工单详情
 * 注意：截图显示详情接口在 /admin 下
 * URL: /v1/admin/work-orders/{id}
 */
export const getOrderDetailApi = (orderId) => {
  return service.get(`/v1/admin/work-orders/${orderId}`);
};

/**
 * 接单确认
 * 注意：截图显示操作接口在 /app 下
 * URL: /v1/app/work-orders/{id}/accept
 */
export const confirmReceiveApi = (orderId) => {
  return service.post(`/v1/app/work-orders/${orderId}/accept`);
};

/**
 * 到场确认
 * URL: /v1/app/work-orders/{id}/arrive
 */
export const confirmArriveApi = (orderId) => {
  return service.post(`/v1/app/work-orders/${orderId}/arrive`);
};

/**
 * 完工/评分 (根据上下文推测)
 * URL: /v1/app/work-orders/{id}/ai-score
 */
export const completeOrderApi = (orderId, data) => {
  return service.post(`/v1/app/work-orders/${orderId}/ai-score`, data);
};

export default service;