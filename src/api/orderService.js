import axios from 'axios';
import { showToast } from 'vant';

// 1. 基础配置
const service = axios.create({
  baseURL: '/api', 
  timeout: 10000
});

// 2. 请求拦截器：注入 Token
service.interceptors.request.use(config => {
  // 这里的 Token 是你刚才提供的
  const token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo3LCJ1c2VybmFtZSI6Inh1ZG9uZyIsInJvbGUiOiJcdTRmZGRcdTZkMDFcdTRlYmFcdTU0NTgiLCJhdmF0YXIiOm51bGwsImV4cCI6MTc3MDA5MTM5N30.SKxET1k5kYBIDC6TA6NAJ1NmD-cqCfwiWy7XqxBdCm8';
  config.headers['Authorization'] = token;
  return config;
});

// 3. 响应拦截器：处理后端返回的 code 0 和 4002
service.interceptors.response.use(
  response => {
    const res = response.data;
    
    // 你的后端：code === 0 代表成功
    if (res.code === 0) {
      return res.data; // 直接把 data 里的内容吐给组件
    } 
    // 特殊情况：code 4002 代表业务逻辑错误（比如重复接单），不算网络错误，但要提示
    else {
      showToast(res.message || '操作失败');
      console.warn('业务异常:', res.message);
      // 返回一个 Promise.reject 以便组件能捕获到这个错误，停止 loading 动画
      return Promise.reject(new Error(res.message));
    }
  },
  error => {
    showToast('网络连接错误');
    return Promise.reject(error);
  }
);

// ===================== 真实接口定义 =====================

/**
 * 1. 获取工单详情
 * 路径: /v1/admin/work-orders/{id}
 */
export const getOrderDetailApi = (orderId) => {
  return service.get(`/v1/admin/work-orders/${orderId}`);
};

/**
 * 2. 接单确认
 * 路径: /v1/app/work-orders/{id}/accept
 */
export const confirmReceiveApi = (orderId) => {
  return service.post(`/v1/app/work-orders/${orderId}/accept`);
};

/**
 * 3. 到场确认
 * 路径: /v1/app/work-orders/{id}/arrive
 */
export const confirmArriveApi = (orderId) => {
  return service.post(`/v1/app/work-orders/${orderId}/arrive`);
};

/**
 * 4. 完工提交 (获取AI评分)
 * 路径猜测: /v1/app/work-orders/{id}/ai-score (根据截图推测，如果不对应请修改)
 */
export const completeOrderApi = (orderId, fileList) => {
  // 这里通常需要上传 FormData，先保留基础结构
  return service.post(`/v1/app/work-orders/${orderId}/ai-score`, {
    // 你的后端可能需要图片地址或 base64，这里暂且留空，先把流程跑通
  });
};