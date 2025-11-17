import { ElMessage } from 'element-plus'

// 调试工具 - 用于帮助识别代码问题
const DebugUtils = {
  logFunctionStart(funcName, params = {}) {
    console.debug(`[DEBUG] 开始执行: ${funcName}`, params);
  },
  
  logFunctionEnd(funcName, result) {
    console.debug(`[DEBUG] 结束执行: ${funcName}`, result);
  },
  
  assert(condition, message) {
    if (!condition) {
      console.error(`[DEBUG] 断言失败: ${message}`);
      // 在开发环境可以抛出错误，生产环境静默失败
      if (process.env.NODE_ENV !== 'production') {
        throw new Error(`断言失败: ${message}`);
      }
    }
  }
};

// API基础URL
const API_BASE = '/v1'
const getToken = () => localStorage.getItem('token') || ''

/**
 * 计算文件的SHA1哈希值
 * @param {File} file - 要计算哈希的文件对象
 * @returns {Promise<string>} - 返回文件的SHA1哈希值
 */
async function calculateFileSha1(file) {
  try {
    // 由于计算大型文件的SHA1可能耗时，这里提供一个简化实现
    // 在实际生产环境中，应使用专门的哈希库进行计算
    console.log('计算文件SHA1值...')
    
    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    
    // 使用Web Crypto API计算SHA-1
    const hashBuffer = await crypto.subtle.digest('SHA-1', arrayBuffer);
    
    // 将ArrayBuffer转换为十六进制字符串
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('文件SHA1值计算完成:', hashHex)
    return hashHex;
  } catch (error) {
    console.warn('计算文件SHA1值失败，使用替代方案:', error.message);
    // 如果计算失败，返回一个基于文件名和时间的伪哈希值作为替代
    return `${file.name}-${Date.now()}`.split('').reduce((acc, char) => {
      acc = ((acc << 5) - acc) + char.charCodeAt(0);
      return acc & acc;
    }, 0).toString(16);
  }
}

/**
 * 通用API请求函数
 * @param {string} path - API路径
 * @param {Object} options - 请求选项
 * @returns {Promise} - 返回请求结果
 */
async function apiRequest(path, {
  method = 'GET',
  body = null,
  headers = {},
  timeout = 30000,
  contentType = 'application/json'
} = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  
  try {
    const token = getToken()
    const requestHeaders = {
      'Authorization': `Bearer ${token}`,
      ...headers
    }
    
    // 根据contentType设置合适的Content-Type头
    if (contentType && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = contentType
    }
    
    const url = `${API_BASE}${path}`
    console.log(`[API请求] 准备发送请求: ${method} ${url}`)
    console.log(`[API请求] 请求头:`, JSON.stringify(requestHeaders))
    console.log(`[API请求] 请求体:`, body ? (contentType.includes('json') ? JSON.parse(body) : body) : null)
    
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body,
      cache: 'no-store',
      signal: ctrl.signal
    })
    
    console.log(`[API响应] ${url} 状态码: ${response.status}`)
    
    if (response.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      throw new Error('401 Unauthorized')
    }
    
    // 处理422错误，获取详细错误信息
    if (response.status === 422) {
      const errorData = await response.json()
      console.error('422错误详情:', errorData)
      throw new Error(`数据格式错误: ${JSON.stringify(errorData)}`)
    }
    
    const contentTypeHeader = response.headers.get('content-type')
    console.log(`[API响应] 内容类型: ${contentTypeHeader}`)
    
    if (contentTypeHeader && contentTypeHeader.includes('application/json')) {
      const data = await response.json()
      console.log(`[API响应] JSON数据:`, data)
      if (data.code !== 0) {
        throw new Error(data.message || '请求失败')
      }
      return data
    } else {
      // 如果不是JSON响应，尝试获取文本内容查看详情
      const textContent = await response.text()
      console.error(`[API响应] 非JSON响应内容:`, textContent)
      throw new Error('非JSON响应')
    }
  } catch (error) {
    // 处理请求取消的情况
    if (error.name === 'AbortError') {
      throw new Error('请求超时')
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 提交图片到 submissions 接口（按后端规范）
 * Body 形如：{ submissions: [ { image_url, task_context, file_name, annotations, score, tags?, client_id? } ] }
 */
export async function submitImage(submissionData) {
  try {
    const payload = {
      submissions: [
        {
          // 后端要求的字段名：image_url（非 file_url）
          image_url: submissionData.image_url,
          task_context: submissionData.task_context || [],
          // 必填：图片级分数（统一做数值转换，避免字符串被判定为非数值而回落 80）
          score: Number.isFinite(Number(submissionData.score)) ? Number(submissionData.score) : 80,
          // 图片级标签（与更新接口保持一致）
          tags: Array.isArray(submissionData.tags) ? submissionData.tags : [],
          annotations: Array.isArray(submissionData.annotations) ? submissionData.annotations.map(anno => ({
            remark: anno.remark || '',
            tags: Array.isArray(anno.tags) ? anno.tags : [],
            score: Number.isFinite(Number(anno.score)) ? Number(anno.score) : 80
          })) : [],
          // 必填：客户端生成的 ID，便于去重/追踪
          client_id: submissionData.client_id || (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
          // 可选：自定义文件名
          file_name: submissionData.file_name,
          // 可选：自定义显示名称
          custom_name: submissionData.custom_name,
        },
      ],
    }

    // 添加调试日志
    console.log('提交的数据:', JSON.stringify(payload, null, 2))

    const data = await apiRequest('/submissions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    
    // 确保返回的数据中包含custom_name字段
    // 修复：在真实API模式下，如果后端没有返回custom_name，我们手动添加它
    if (data && data.data && Array.isArray(data.data)) {
      data.data = data.data.map(item => ({
        ...item,
        custom_name: item.custom_name || submissionData.custom_name || ''
      }))
      console.log('修正后返回的数据:', JSON.stringify(data.data, null, 2))
    }
    
    // 添加响应调试日志，特别关注custom_name字段
    console.log('[提交服务] API响应数据:', JSON.stringify(data, null, 2))
    if (data && data.data && Array.isArray(data.data)) {
      const firstSubmission = data.data[0]
      console.log('[提交服务] 响应中是否包含custom_name:', firstSubmission?.custom_name !== undefined)
      console.log('[提交服务] 返回的custom_name值:', firstSubmission?.custom_name)
      console.log('[提交服务] custom_name类型:', typeof firstSubmission?.custom_name)
      console.log('[提交服务] 提交前的custom_name值:', submissionData.custom_name)
      
      // 确保响应数据中包含custom_name字段，即使后端没有返回
      if (firstSubmission && submissionData.custom_name && !firstSubmission.hasOwnProperty('custom_name')) {
        firstSubmission.custom_name = submissionData.custom_name
        console.log('[提交服务] 后端未返回custom_name，手动添加:', firstSubmission.custom_name)
      }
    }
    
    ElMessage.success('图片提交成功')
    return data
  } catch (error) {
    console.error('提交失败详情:', error)
    ElMessage.error('图片提交失败：' + (error.message || '未知错误'))
    throw error
  }
}

/**
 * 配置是否使用模拟数据模式
 * 设置为 false 可以使用真实API调用
 * true = 使用模拟数据 (开发测试)
 * false = 使用真实API (生产环境)
 */
const USE_MOCK_MODE = false; // 使用真实API

/**
 * 获取预签名URL用于文件上传
 * @returns {Promise<Object>} - 返回预签名URL信息
 */
async function getPresignedUrl() {
  try {
    console.log('获取预签名URL...')
    // 实际API调用
    console.log('使用真实API调用获取预签名URL')
    const response = await apiRequest('/cos/put-presigned-url', {
        method: 'GET',
        timeout: 15000 // 减少超时时间以快速响应
      });
    
    // 添加详细调试日志
    console.log('预签名URL API响应数据:', JSON.stringify(response, null, 2));
    console.log('预签名URL数据结构:', response.data);
    
    // 确保返回的数据对象包含必要的结构
    const result = response.data || {};
    
    // 检查是否包含presigned_url字段
    if (!result.presigned_url && !result.url && !result.upload_url) {
      console.error('响应数据中缺少预签名URL相关字段 (presigned_url, url, upload_url)');
      // 提供一个有意义的错误，而不是返回无效数据
      throw new Error('API返回的数据缺少必要的预签名URL字段');
    }
    
    // 记录找到的URL字段
    if (result.presigned_url) console.log('presigned_url值:', result.presigned_url);
    if (result.url) console.log('url值:', result.url);
    if (result.upload_url) console.log('upload_url值:', result.upload_url);
    
    return result;
  } catch (error) {
    console.error('获取预签名URL失败:', error);
    // 提供更详细的错误信息
    const errorMessage = error.message || '未知错误';
    throw new Error(`获取预签名URL失败: ${errorMessage}`);
  }
}

/**
 * 使用预签名URL上传文件到腾讯云COS
 * @param {File} file - 图片文件
 * @param {string} presignedUrl - 预签名URL
 * @param {number} fileSize - 文件大小
 * @param {Object} options - 上传选项
 * @param {number} options.maxRetries - 最大重试次数（默认3次）
 * @param {number} options.retryDelay - 重试间隔（默认1000ms）
 * @returns {Promise<Object>} - 上传结果
 */
async function uploadFileWithPresignedUrl(file, presignedUrl, fileSize, options = {}) {
  // 上传配置
  const config = {
    maxRetries: options.maxRetries || 3,
    baseRetryDelay: options.retryDelay || 1000,
    timeoutPerAttempt: fileSize > 50 * 1024 * 1024 ? 300000 : 60000, // 大文件5分钟，小文件1分钟
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2) + 'MB'
    }
  };
  
  // 全局中止控制器
  const globalController = new AbortController();
  const globalSignal = globalController.signal;
  
  // 重试计数器
  let retries = 0;
  
  // 辅助函数定义必须在调用之前
  
  // 验证预签名URL
  function validatePresignedUrl(url, requestId) {
    if (!url || typeof url !== 'string') {
      throw new Error('预签名URL无效或未提供');
    }
    
    try {
      const urlObj = new URL(url);
      console.log(`[${requestId}] 预签名URL验证通过`);
      
      // 检查腾讯云COS预签名URL的过期时间
      const signTime = urlObj.searchParams.get('q-sign-time');
      if (signTime) {
        // q-sign-time格式为：开始时间戳;结束时间戳
        const [startTime, endTime] = signTime.split(';').map(Number);
        const now = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
        
        // 检查URL是否已过期
        if (now > endTime) {
          console.error(`[${requestId}] 预签名URL已过期! 当前时间: ${now}, 过期时间: ${endTime}`);
          throw new Error('预签名URL已过期');
        }
        
        // 检查URL是否即将过期（30秒内）
        const timeRemaining = endTime - now;
        if (timeRemaining < 30) {
          console.warn(`[${requestId}] 预签名URL即将过期! 剩余时间: ${timeRemaining}秒`);
        }
        
        // 记录URL的有效时间信息
        const startTimeFormatted = new Date(startTime * 1000).toLocaleString();
        const endTimeFormatted = new Date(endTime * 1000).toLocaleString();
        console.log(`[${requestId}] 预签名URL时间信息: 开始=${startTimeFormatted}, 结束=${endTimeFormatted}, 有效期=${Math.floor((endTime - startTime)/60)}分钟`);
      }
    } catch (error) {
      console.error(`[${requestId}] 预签名URL格式错误:`, error);
      throw new Error('预签名URL格式无效');
    }
  }
  
  // 分片上传辅助函数
  const chunkedUploadHelper = {
    // 默认分片大小（5MB）
    DEFAULT_CHUNK_SIZE: 5 * 1024 * 1024,
    
    // 获取分片片信息
    getChunkInfo(file, chunkIndex, chunkSize) {
      const start = chunkIndex * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      return {
        chunk,
        start,
        end,
        index: chunkIndex,
        size: end - start,
        totalSize: file.size,
        totalChunks: Math.ceil(file.size / chunkSize)
      };
    }
  };
  
  // 备用上传机制
  const alternativeUploader = {
    // 判断是否应该使用备用上传
    shouldUseAlternativeUpload(error, retries, file) {
      // 当遇到特定错误且重试次数达到阈值时使用备用上传
      const errorType = error.type || (error.name && error.name.toLowerCase());
      
      // 触发条件：
      // 1. 遇到网络中断类错误
      // 2. 达到最大重试次数的一半
      // 3. 文件较大时更倾向于使用分片上传
      const isNetworkError = errorType === 'aborted' || errorType === 'network' || 
                            error.message && error.message.includes('ERR_ABORTED');
      const retryThreshold = Math.ceil(config.maxRetries / 2);
      const isLargeFile = file.size > 10 * 1024 * 1024; // 10MB
      
      return isNetworkError && retries >= retryThreshold || 
             (isLargeFile && retries >= 2);
    },
    
    // 执行分片上传作为备用方案
    async executeChunkedUpload(file, presignedUrl) {
      console.log(`[${config.requestId}] 启动备用上传机制: 分片上传`);
      
      // 获取配置
      const chunkSize = chunkedUploadHelper.DEFAULT_CHUNK_SIZE;
      const maxConcurrentChunks = 3;
      const maxChunkRetries = 5;
      
      // 计算分片信息
      const totalChunks = Math.ceil(file.size / chunkSize);
      console.log(`[${config.requestId}] 分片上传配置:`, {
        chunkSize: `${(chunkSize / (1024 * 1024)).toFixed(1)}MB`,
        totalChunks,
        maxConcurrentChunks,
        maxChunkRetries
      });
      
      // 跟踪已上传的分片
      const uploadedChunks = new Set();
      const failedChunks = [];
      
      // 上传单个分片
      async function uploadChunk(chunkIndex) {
        if (uploadedChunks.has(chunkIndex)) {
          return;
        }
        
        const chunkInfo = chunkedUploadHelper.getChunkInfo(file, chunkIndex, chunkSize);
        
        console.log(`[${config.requestId}] 开始上传分片 ${chunkIndex + 1}/${totalChunks} (${chunkInfo.size} bytes)`);
        
        let chunkRetries = 0;
        
        while (chunkRetries <= maxChunkRetries) {
          try {
            // 为分片上传创建修改过的URL（添加分片信息）
            const chunkUrl = new URL(presignedUrl);
            chunkUrl.searchParams.set('_chunk', chunkIndex.toString());
            chunkUrl.searchParams.set('_total_chunks', totalChunks.toString());
            
            // 创建临时文件对象用于分片上传
            const chunkFile = new Blob([chunkInfo.chunk], { type: file.type });
            
            // 构建分片上传的请求配置
            const chunkController = new AbortController();
            const chunkConfig = {
              method: 'PUT',
              body: chunkFile,
              signal: chunkController.signal,
              headers: {
                'Content-Type': file.type,
                'Content-Length': chunkInfo.size.toString(),
                'X-Chunk-Index': chunkIndex.toString(),
                'X-Total-Chunks': totalChunks.toString(),
                'X-File-Name': encodeURIComponent(file.name)
              },
              referrerPolicy: 'no-referrer-when-downgrade',
              credentials: 'omit'
            };
            
            // 设置分片上传超时（更长的超时时间）
            const chunkTimeout = Math.max(30000, chunkInfo.size / 1024 / 1024 * 5000);
            const chunkTimeoutId = setTimeout(() => {
              console.warn(`[${config.requestId}] 分片 ${chunkIndex} 上传超时，正在中止...`);
              chunkController.abort();
            }, chunkTimeout);
            
            try {
              const startTime = Date.now();
              const response = await fetch(chunkUrl.toString(), chunkConfig);
              const duration = Date.now() - startTime;
              
              clearTimeout(chunkTimeoutId);
              
              if (!response.ok) {
                console.error(`[${config.requestId}] 分片 ${chunkIndex} 上传失败，状态码: ${response.status}`);
                throw new Error(`Chunk upload failed with status ${response.status}`);
              }
              
              uploadedChunks.add(chunkIndex);
              console.log(`[${config.requestId}] 分片 ${chunkIndex + 1}/${totalChunks} 上传成功，耗时: ${duration}ms`);
              return;
            } catch (error) {
              clearTimeout(chunkTimeoutId);
              
              // 增加重试计数
              chunkRetries++;
              
              // 如果达到最大重试次数，记录失败的分片
              if (chunkRetries > maxChunkRetries) {
                console.error(`[${config.requestId}] 分片 ${chunkIndex} 达到最大重试次数，上传失败`);
                failedChunks.push(chunkIndex);
                return;
              }
              
              // 计算指数退避延迟
              const delay = Math.min(5000, 1000 * Math.pow(2, chunkRetries) + Math.random() * 1000);
              console.log(`[${config.requestId}] 分片 ${chunkIndex} 上传失败，${delay.toFixed(0)}ms 后重试 (${chunkRetries}/${maxChunkRetries})`);
              
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } catch (error) {
            console.error(`[${config.requestId}] 分片 ${chunkIndex} 上传发生未知错误:`, error);
            failedChunks.push(chunkIndex);
            return;
          }
        }
      }
      
      // 使用并发控制上传所有分片
      console.log(`[${config.requestId}] 开始并发上传所有分片，最大并发数: ${maxConcurrentChunks}`);
      
      const startTime = Date.now();
      
      // 第一次批量上传
      const chunkQueue = Array.from({ length: totalChunks }, (_, i) => i);
      const uploadPromises = [];
      let activeUploads = 0;
      
      while (chunkQueue.length > 0 || activeUploads > 0) {
        // 检查全局中止信号
        if (globalSignal.aborted) {
          throw new Error('上传已被全局中止');
        }
        
        // 启动新的上传，如果有容量
        while (activeUploads < maxConcurrentChunks && chunkQueue.length > 0) {
          const chunkIndex = chunkQueue.shift();
          activeUploads++;
          
          const uploadPromise = uploadChunk(chunkIndex)
            .finally(() => {
              activeUploads--;
            });
          
          uploadPromises.push(uploadPromise);
        }
        
        // 等待至少一个上传完成
        if (uploadPromises.length > 0) {
          await Promise.race(uploadPromises);
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`[${config.requestId}] ✅ 备用分片上传完成，总耗时: ${duration}ms`);
      
      return {
        success: true,
        duration,
        chunks: totalChunks,
        method: 'chunked',
        requestId: config.requestId
      };
    },
    
    // 使用HTTP客户端替代方案（使用XMLHttpRequest）
    async executeXhrUpload(file, presignedUrl) {
      console.log(`[${config.requestId}] 启动备用上传机制: XMLHttpRequest`);
      
      // 为XHR上传添加时间戳避免缓存
      const xhrUploadUrl = new URL(presignedUrl);
      xhrUploadUrl.searchParams.set('_xhr_upload', '1');
      xhrUploadUrl.searchParams.set('_ts', Date.now().toString());
      
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // 配置XHR
        xhr.open('PUT', xhrUploadUrl.toString());
        xhr.responseType = 'text';
        xhr.timeout = config.timeoutPerAttempt; // 使用与fetch相同的超时设置
        
        // 启用CORS设置
        xhr.withCredentials = false; // 不发送凭证，与fetch配置保持一致
        
        // 设置请求头 - 优化CORS兼容性
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.setRequestHeader('Content-Length', file.size.toString());
        xhr.setRequestHeader('X-Alternative-Method', 'XHR');
        xhr.setRequestHeader('X-Request-ID', config.requestId);
        
        // 进度监控
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            console.log(`[${config.requestId}] XHR上传进度: ${percentComplete}%`);
          }
        });
        
        // 超时处理
        xhr.addEventListener('timeout', () => {
          console.error(`[${config.requestId}] XHR上传超时`);
          reject(new Error('XHR upload timed out'));
        });
        
        // 中止处理
        xhr.addEventListener('abort', () => {
          console.warn(`[${config.requestId}] XHR上传被中止`);
          reject(new Error('XHR upload aborted'));
        });
        
        // 成功处理
        xhr.addEventListener('load', () => {
          console.log(`[${config.requestId}] XHR上传完成，状态码: ${xhr.status}`);
          
          // 记录响应头信息用于调试
          console.log(`[${config.requestId}] XHR响应头:`, {
            'Access-Control-Allow-Origin': xhr.getResponseHeader('Access-Control-Allow-Origin'),
            'Content-Type': xhr.getResponseHeader('Content-Type'),
            'Status': xhr.status
          });
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              success: true,
              status: xhr.status,
              method: 'xhr',
              requestId: config.requestId,
              responseHeaders: {
                'access-control-allow-origin': xhr.getResponseHeader('Access-Control-Allow-Origin')
              }
            });
          } else {
            // 详细记录HTTP错误信息
            reject(new Error(`XHR upload failed with status ${xhr.status}: ${xhr.statusText}`));
          }
        });
        
        // 错误处理
        xhr.addEventListener('error', (error) => {
          console.error(`[${config.requestId}] XHR上传错误:`, error);
          console.log(`[${config.requestId}] XHR状态: ${xhr.readyState}, 状态码: ${xhr.status}`);
          reject(new Error('XHR upload failed - likely CORS or network issue'));
        });
        
        // 发送请求
        console.log(`[${config.requestId}] 开始XHR上传...`);
        xhr.send(file);
      });
    }
  };
  
  // 分析上传错误
  function analyzeUploadError(error) {
    const errorMessage = error.message || String(error);
    const errorName = error.name || '';
    const errorStack = error.stack || '';
    
    // 初始化分析结果
    const analysis = {
      type: 'unknown',
      canRetry: false,
      isNetworkRelated: false,
      details: errorMessage,
      needNewPresignedUrl: false,
      needsAlternativeMethod: false, // 是否需要使用备用上传方法
      isCorsRelated: false // 是否可能是CORS相关问题
    };
    
    // 检查是否是中止错误
    if (errorName === 'AbortError' || 
        errorMessage.includes('abort') || 
        errorMessage.includes('aborted')) {
      analysis.type = 'aborted';
      analysis.isNetworkRelated = true;
      analysis.canRetry = !globalSignal.aborted; // 如果是全局中止则不能重试
    }
    // 网络错误
    else if (errorName === 'TypeError' || 
             errorMessage.includes('network') || 
             errorMessage.includes('failed to fetch') ||
             errorMessage.includes('ERR_ABORTED') ||
             errorMessage.includes('Failed to load resource')) {
      analysis.type = 'network';
      analysis.isNetworkRelated = true;
      analysis.canRetry = true;
      
      // 特定处理ERR_ABORTED错误
      if (errorMessage.includes('ERR_ABORTED')) {
        console.warn(`[${config.requestId}] 检测到ERR_ABORTED错误，可能原因: 请求被中断、CORS问题、网络不稳定或URL过期`);
        
        // 标记为可能需要新的预签名URL
        if (presignedUrl && presignedUrl.includes('q-sign-time')) {
          analysis.needNewPresignedUrl = true;
        }
        
        // 标记为可能是CORS相关问题
        analysis.isCorsRelated = true;
        
        // 对于ERR_ABORTED，总是尝试备用方法
        analysis.needsAlternativeMethod = true;
      }
    }
    // HTTP错误
    else if (errorName === 'HttpError' || 
             errorMessage.startsWith('HTTP Error') || 
             errorMessage.includes('status')) {
      analysis.type = 'http';
      analysis.canRetry = false; // 通常HTTP错误不需要重试
    }
    // 其他可以重试的错误
    else {
      analysis.canRetry = true; // 默认允许重试
    }
    
    console.log(`[${config.requestId}] 错误分析结果:`, analysis);
    return analysis;
  }
  
  // 判断是否应该重试
  function shouldRetryUpload(errorAnalysis) {
    return errorAnalysis.canRetry && retries <= config.maxRetries;
  }
  
  // 检查网络状态
  async function checkNetworkStatus() {
    try {
      // 使用navigator.onLine检查基本网络状态
      const isOnline = navigator.onLine;
      console.log(`[${config.requestId}] 网络状态检查: ${isOnline ? '在线' : '离线'}`);
      
      // 更详细的网络检测：尝试ping一个可靠的服务器
      if (isOnline) {
        try {
          // 使用HEAD请求来最小化数据传输
          const response = await fetch('https://attach-1377842862.cos.ap-chengdu.myqcloud.com', {
            method: 'HEAD',
            signal: AbortSignal.timeout(2000), // 2秒超时
            cache: 'no-store'
          });
          console.log(`[${config.requestId}] COS服务连通性: ${response.ok ? '正常' : '异常'}`);
          return true;
        } catch (pingError) {
          console.warn(`[${config.requestId}] COS服务连通性检测失败:`, pingError.message);
          return false;
        }
      }
      return isOnline;
    } catch (error) {
      console.error(`[${config.requestId}] 网络状态检测出错:`, error);
      return false;
    }
  }
  
  // 准备和等待重试
  async function prepareAndWaitForRetry(errorAnalysis) {
    // 计算带随机抖动的退避延迟
    const exponentialDelay = config.baseRetryDelay * Math.pow(2, retries - 1);
    const jitter = Math.random() * 500; // 0-500ms的随机抖动
    const delay = Math.min(exponentialDelay + jitter, 10000); // 最大10秒
    
    console.log(`[${config.requestId}] 准备重试，等待 ${delay.toFixed(0)}ms (第 ${retries} 次重试)`);
    
    // 如果是网络错误，尝试等待网络恢复
    if (errorAnalysis.isNetworkRelated) {
      console.log(`[${config.requestId}] 检测网络状态...`);
      
      // 进行网络状态检测
      const networkOk = await checkNetworkStatus();
      if (!networkOk) {
        console.log(`[${config.requestId}] 网络不可用，等待网络恢复...`);
        // 等待更长时间让网络可能恢复
        await new Promise(resolve => setTimeout(resolve, Math.max(delay, 3000)));
        return;
      }
    }
    
    // 等待指定的延迟时间
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  // 更新URL以避免缓存问题，并检查URL是否过期
  function updateUrlForRetry(url, errorAnalysis) {
    const retryUrl = new URL(url);
    
    // 检查URL是否包含过期的签名时间
    const signTime = retryUrl.searchParams.get('q-sign-time');
    if (signTime) {
      const [startTime, endTime] = signTime.split(';');
      const currentTime = Math.floor(Date.now() / 1000);
      
      // 如果URL即将过期（剩余时间少于30秒），记录警告
      if (endTime && (parseInt(endTime) - currentTime) < 30) {
        console.warn(`[${config.requestId}] 预签名URL即将过期，剩余时间: ${parseInt(endTime) - currentTime}秒`);
        // 注意：这里我们无法自动获取新的预签名URL，因为这需要后端交互
        // 但我们会在重试后仍然传递给上层，让上层有机会处理这种情况
      }
    }
    
    // 添加或更新时间戳参数以避免缓存
    retryUrl.searchParams.set('_retry', retries.toString());
    retryUrl.searchParams.set('_ts', Date.now().toString());
    
    console.log(`[${config.requestId}] 更新URL以避免缓存，添加重试参数`);
    return retryUrl.toString();
  }
  
  // 创建增强的错误对象
  function createEnhancedError(originalError, errorAnalysis) {
    // 构建更详细的错误消息
    let detailedMessage = `上传失败: ${errorAnalysis.details}`;
    
    // 添加错误分析上下文信息
    if (errorAnalysis.isCorsRelated) {
      detailedMessage += ' [CORS相关错误]';
    }
    
    if (errorAnalysis.needsAlternativeMethod) {
      detailedMessage += ' [建议使用备用上传]';
    }
    
    const enhancedError = new Error(detailedMessage);
    enhancedError.originalError = originalError;
    enhancedError.errorType = errorAnalysis.type;
    enhancedError.requestId = config.requestId;
    enhancedError.retriesAttempted = retries;
    enhancedError.fileInfo = config.fileInfo;
    
    // 添加更多诊断信息
    enhancedError.timestamp = new Date().toISOString();
    enhancedError.errorAnalysis = errorAnalysis;
    enhancedError.originalMessage = originalError.message || '未知错误';
    
    // 特别处理ERR_ABORTED错误
    if (enhancedError.originalMessage.includes('ERR_ABORTED')) {
      enhancedError.isAborted = true;
      enhancedError.suggestion = '检查网络连接和CORS配置，考虑使用备用上传方式';
      detailedMessage += ' [ERR_ABORTED错误]';
      enhancedError.message = detailedMessage;
    }
    
    return enhancedError;
  }
  
  // 执行单次上传尝试
  async function attemptSingleUpload() {
    console.log(`[${config.requestId}] 开始上传尝试 #${retries + 1}`);
    
    // 创建本次尝试的中止控制器
    const attemptController = new AbortController();
    const attemptSignal = attemptController.signal;
    
    // 创建请求配置
    const requestConfig = {
      method: 'PUT',
      body: file,
      signal: attemptSignal,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Length': file.size.toString(),
        // 移除Access-Control-Allow-Origin（这是服务器响应头，不是请求头）
        // 添加自定义头部以帮助诊断
        'X-Request-ID': config.requestId,
        'X-Request-Retry': retries.toString()
      },
      // 优化CORS设置
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer', // 使用更安全的设置
      cache: 'no-store',
      // 禁用keepalive以避免连接限制问题
      keepalive: false
    };
    
    // 设置本次尝试的超时
    const attemptTimeoutId = setTimeout(() => {
      console.warn(`[${config.requestId}] 上传尝试 #${retries + 1} 超时，正在中止...`);
      attemptController.abort();
    }, config.timeoutPerAttempt);
    
    try {
      // 记录开始时间
      const startTime = Date.now();
      
      // 执行fetch请求
      console.log(`[${config.requestId}] 发送上传请求到: ${presignedUrl.slice(0, 50)}...`);
      const response = await fetch(presignedUrl, requestConfig);
      
      // 清除超时定时器
      clearTimeout(attemptTimeoutId);
      
      // 记录完成时间
      const duration = Date.now() - startTime;
      console.log(`[${config.requestId}] 上传尝试完成，状态码: ${response.status}，耗时: ${duration}ms`);
      
      // 检查响应状态
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      
      // 返回成功结果
      return {
        success: true,
        status: response.status,
        duration,
        requestId: config.requestId,
        retriesAttempted: retries
      };
    } catch (error) {
      // 清除超时定时器
      clearTimeout(attemptTimeoutId);
      
      // 重新抛出错误以便上层处理
      throw error;
    }
  }
  
  // 执行上传和重试的主函数
  async function performUploadWithRetry() {
    // 循环重试直到成功或达到最大重试次数
    let usedAlternativeUpload = false;
    let corsRelatedErrors = 0; // 跟踪CORS相关错误的数量
    let networkRelatedErrors = 0; // 跟踪网络相关错误的数量
    let lastError = null;
    
    // 最大重试次数加1是因为我们从0开始计数
    const maxAttempts = config.maxRetries + 1;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // 检查全局中止信号
      if (globalSignal.aborted) {
        throw new Error('全局上传已被中止');
      }
      
      console.log(`[${config.requestId}] 开始上传尝试 #${attempt}/${maxAttempts}`);
      
      try {
        // 在每次尝试前验证预签名URL
        validatePresignedUrl(presignedUrl, config.requestId);
        
        // 执行单次上传尝试
        const result = await attemptSingleUpload();
        // 添加是否使用了备用上传的标记
        result.usedAlternativeUpload = usedAlternativeUpload;
        result.attempts = attempt;
        console.log(`[${config.requestId}] 上传成功，总共尝试: ${attempt}次`);
        return result;
      } catch (error) {
        lastError = error;
        // 分析错误并决定是否重试
        const errorAnalysis = analyzeUploadError(error);
        
        // 统计错误类型
        if (errorAnalysis.isCorsRelated) {
          corsRelatedErrors++;
          console.warn(`[${config.requestId}] CORS相关错误计数: ${corsRelatedErrors}`);
        }
        
        if (errorAnalysis.isNetworkRelated) {
          networkRelatedErrors++;
          console.warn(`[${config.requestId}] 网络相关错误计数: ${networkRelatedErrors}`);
        }
        
        // 检查是否需要新的预签名URL
        if (errorAnalysis.needNewPresignedUrl && attempt < maxAttempts) {
          console.log(`[${config.requestId}] 尝试获取新的预签名URL，因为当前URL可能已过期或无效`);
          try {
            // 这里可以添加获取新预签名URL的逻辑
            // 由于我们没有直接访问getPresignedUrl的权限，这里只记录日志
            console.warn(`[${config.requestId}] 建议上层调用重新获取预签名URL`);
          } catch (urlError) {
            console.error(`[${config.requestId}] 获取新预签名URL失败:`, urlError);
          }
        }
        
        // 检查是否应该使用备用上传
        // 优先使用备用上传如果：
        // 1. 遇到ERR_ABORTED错误
        // 2. CORS相关错误
        // 3. 网络错误累积
        // 4. 达到默认的备用上传条件
        const shouldUseAltUpload = !usedAlternativeUpload && 
                                  (errorAnalysis.needsAlternativeMethod || 
                                   corsRelatedErrors > 0 ||
                                   networkRelatedErrors > 1 ||
                                   alternativeUploader.shouldUseAlternativeUpload(error, retries, file));
                                    
        if (shouldUseAltUpload) {
          console.log(`[${config.requestId}] 切换到备用上传机制，因为遇到了: ${errorAnalysis.type || error.name || error.message}`);
          
          try {
            // 对于ERR_ABORTED和CORS错误，优先使用XHR上传
            let alternativeResult;
            
            if (errorAnalysis.isCorsRelated || errorAnalysis.needsAlternativeMethod) {
              // CORS相关错误优先使用XHR
              console.log(`[${config.requestId}] 由于CORS相关错误，优先使用XHR上传`);
              alternativeResult = await alternativeUploader.executeXhrUpload(file, presignedUrl);
            } else if (file.size > 2 * 1024 * 1024) { // 2MB以上使用分片上传
              alternativeResult = await alternativeUploader.executeChunkedUpload(file, presignedUrl);
            } else { // 小文件使用XHR上传
              alternativeResult = await alternativeUploader.executeXhrUpload(file, presignedUrl);
            }
            
            // 标记使用了备用上传
            usedAlternativeUpload = true;
            alternativeResult.usedAlternativeUpload = true;
            alternativeResult.attempts = attempt;
            console.log(`[${config.requestId}] 备用上传成功，总共尝试: ${attempt}次`);
            return alternativeResult;
          } catch (altError) {
            console.error(`[${config.requestId}] 备用上传机制也失败了:`, altError);
            // 继续重试流程
          }
        }
        
        // 如果是最后一次尝试，不再重试
        if (attempt >= maxAttempts) {
          console.error(`[${config.requestId}] 达到最大尝试次数(${maxAttempts})，上传失败`);
          break;
        }
        
        // 检查是否应该重试
        if (shouldRetryUpload(errorAnalysis)) {
          retries++;
          
          // 执行重试逻辑
          await prepareAndWaitForRetry(errorAnalysis);
          
          // 更新预签名URL以避免缓存问题
          presignedUrl = updateUrlForRetry(presignedUrl, errorAnalysis);
          
          console.log(`[${config.requestId}] 准备开始第 ${attempt + 1}/${maxAttempts} 次重试...`);
        } else {
          console.error(`[${config.requestId}] 错误不可重试，放弃上传`);
          break;
        }
      }
    }
    
    // 循环结束，准备执行备用上传逻辑

    // 达到最大重试次数，但还可以尝试备用上传
    if (!usedAlternativeUpload) {
      console.log(`[${config.requestId}] 达到最大重试次数，尝试最后一次备用上传...`);
      
      try {
        const lastResortResult = await alternativeUploader.executeXhrUpload(file, presignedUrl);
        lastResortResult.usedAlternativeUpload = true;
        lastResortResult.wasLastResort = true;
        
        return lastResortResult;
      } catch (lastResortError) {
        console.error(`[${config.requestId}] 最后一次备用上传也失败了`);
      }
    }
    
    // 达到最大重试次数
    throw new Error(`上传失败：已达到最大重试次数 (${config.maxRetries}次) 并且备用上传也失败`);
  }
  
  // 主执行逻辑开始
  console.log(`[${config.requestId}] 使用预签名URL上传文件启动`);
  console.log(`[${config.requestId}] 配置信息:`, {
    maxRetries: config.maxRetries,
    baseRetryDelay: config.baseRetryDelay,
    timeoutPerAttempt: config.timeoutPerAttempt,
    globalTimeout: config.timeoutPerAttempt * (config.maxRetries + 1)
  });
  console.log(`[${config.requestId}] 文件信息:`, config.fileInfo);
  
  // 验证预签名URL
  validatePresignedUrl(presignedUrl, config.requestId);
  
  // 设置全局超时定时器
  const globalTimeoutId = setTimeout(() => {
    console.warn(`[${config.requestId}] 全局上传超时，中止所有重试...`);
    globalController.abort();
  }, config.timeoutPerAttempt * (config.maxRetries + 1));
  
  try {
    // 执行上传尝试
    return await performUploadWithRetry();
  } finally {
    // 清理全局定时器
    clearTimeout(globalTimeoutId);
  }
}
/**
 * 上传文件到腾讯云COS
 * @param {File} file - 图片文件
 * @returns {Promise<string>} - 返回COS URL
 */
async function uploadFileToTencentCOS(file) {
  // 验证文件类型和大小
  if (!file.type.startsWith('image/')) {
    throw new Error('只能上传图片文件')
  }
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error('文件大小不能超过10MB')
  }
  
  console.log('开始上传文件到腾讯云COS...')
  
  // 1. 获取预签名URL
  const presignedData = await getPresignedUrl()
  
  // 2. 使用预签名URL上传文件
  await uploadFileWithPresignedUrl(file, presignedData.presigned_url)
  
  // 3. 构建完整的COS URL
  let cosUrl;
  
  // 方案1: 使用API返回的参数构建完整URL
  if (presignedData.bucket && presignedData.region && presignedData.key) {
    cosUrl = `https://${presignedData.bucket}.cos.${presignedData.region}.myqcloud.com/${presignedData.key}`
    console.log('方案1: 使用API参数构建COS URL:', cosUrl)
  }
  // 方案2: 从预签名URL中提取基础URL和路径来构建
  else if (presignedUrl) {
    try {
      const urlObj = new URL(presignedUrl);
      // 从预签名URL中提取基础信息
      cosUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      console.log('方案2: 从预签名URL提取构建COS URL:', cosUrl)
    } catch (e) {
      console.error('无法从预签名URL构建COS URL:', e)
    }
  }
  
  // 方案3: 如果前两种方案失败，使用默认域名和文件key
  if (!cosUrl && presignedData.file_key) {
    // 假设使用成都区域的COS
    cosUrl = `https://attach-1377842862.cos.ap-chengdu.myqcloud.com/${presignedData.file_key}`;
    console.log('方案3: 使用默认域名构建COS URL:', cosUrl)
  }
  
  // 确保返回完整的URL，避免只返回fileKey
  console.log('最终返回的COS URL:', cosUrl || presignedData.file_key)
  return cosUrl || presignedData.file_key;
}

/**
 * 上传图片文件并提交
 * @param {File} file - 图片文件
 * @param {Object} metadata - 图片元数据
 * @returns {Promise} - 返回上传和提交结果
 */
// 用户友好的错误处理助手函数
function showUserFriendlyError(error, recoveryOptions = []) {
  console.error('显示用户友好错误:', error);
  
  let message = '上传失败';
  let detailedMessage = '';
  
  // 根据错误类型生成不同的提示消息
  if (error.isAborted || (error.message && error.message.includes('ERR_ABORTED'))) {
    message = '上传被中断';
    detailedMessage = '网络连接可能不稳定，请检查您的网络设置';
  } else if (error.errorType === 'CORS_ERROR') {
    message = '跨域权限错误';
    detailedMessage = '无法连接到服务器，请稍后重试';
  } else if (error.errorType === 'TIMEOUT_ERROR') {
    message = '上传超时';
    detailedMessage = '服务器响应时间过长，请检查网络或稍后重试';
  } else if (error.message && error.message.includes('URL已过期')) {
    message = '上传链接已过期';
    detailedMessage = '系统将自动尝试获取新的上传链接';
  } else if (error.message && error.message.includes('网络错误')) {
    message = '网络连接错误';
    detailedMessage = '请检查您的网络连接后重试';
  } else {
    detailedMessage = error.message || '未知错误';
  }
  
  // 显示错误消息
  if (typeof ElMessage !== 'undefined') {
    ElMessage.error({
      message: `${message}: ${detailedMessage}`,
      customClass: 'upload-error-message',
      duration: 5000,
      showClose: true
    });
  }
  
  // 如果有恢复选项，显示恢复建议
  if (recoveryOptions.length > 0) {
    console.log('可用的恢复选项:', recoveryOptions);
    // 这里可以根据需要实现更复杂的恢复选项展示
  }
  
  return { message, detailedMessage, recoveryOptions };
}

// 自动重试逻辑
async function attemptRecoveryWithRetry(operation, maxRetries = 2, retryDelay = 2000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`恢复尝试 ${attempt + 1}/${maxRetries + 1}`);
      const result = await operation();
      console.log('恢复成功');
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`恢复尝试 ${attempt + 1} 失败:`, error);
      
      if (attempt < maxRetries) {
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(1.5, attempt)));
      }
    }
  }
  
  throw lastError; // 所有恢复尝试都失败
}

export async function uploadAndSubmitImage(file, metadata = {}) {
  // 使用调试工具记录函数开始
  DebugUtils.logFunctionStart('uploadAndSubmitImage', {
    fileName: file?.name,
    fileSize: file?.size,
    hasMetadata: !!metadata
  });
  
  let retryCount = 0;
  const maxAutoRetries = 2;
  
  while (retryCount <= maxAutoRetries) {
    try {
      console.log(`开始上传并提交图片... 尝试 ${retryCount + 1}/${maxAutoRetries + 1}`)
      console.log('文件信息:', file.name, file.size, file.type)
      console.log('元数据:', metadata)
      
      // 1. 获取预签名URL
      const presignedData = await getPresignedUrl()
      
      // 添加额外的验证逻辑
      console.log('预签名数据完整对象:', JSON.stringify(presignedData, null, 2));
      
      // 检查presignedData是否有效以及是否包含必要字段
      if (!presignedData || typeof presignedData !== 'object') {
        throw new Error('无效的预签名数据结构');
      }
      
      // 尝试多种可能的字段名，增加兼容性
      let presignedUrl = presignedData.presigned_url || 
                        presignedData.url || 
                        presignedData.upload_url;
      let fileKey = presignedData.file_key || presignedData.key;
      
      console.log('最终使用的预签名URL:', presignedUrl);
      
      if (!presignedUrl) {
        throw new Error('无法从响应中提取有效的预签名URL');
      }
      
      // 预验证预签名URL的有效性和过期时间
      try {
        const urlObj = new URL(presignedUrl);
        const signTime = urlObj.searchParams.get('q-sign-time');
        
        if (signTime) {
          const [startTime, endTime] = signTime.split(';').map(Number);
          const now = Math.floor(Date.now() / 1000);
          
          if (now > endTime) {
            console.error('获取的预签名URL已经过期! 立即重新获取...');
            // 自动重新获取预签名URL
            console.log('尝试重新获取预签名URL...');
            const newPresignedData = await getPresignedUrl();
            presignedUrl = newPresignedData.presigned_url || 
                          newPresignedData.url || 
                          newPresignedData.upload_url;
            
            if (presignedUrl) {
              console.log('成功获取新的预签名URL');
              // 更新file_key等信息
              fileKey = newPresignedData.file_key || newPresignedData.key || fileKey;
            } else {
              throw new Error('重新获取预签名URL失败');
            }
          } else {
            const timeRemaining = endTime - now;
            console.log(`预签名URL有效期剩余: ${timeRemaining}秒`);
            
            // 如果剩余时间较少，发出警告
            if (timeRemaining < 60) {
              console.warn(`预签名URL即将过期，建议尽快上传！剩余时间: ${timeRemaining}秒`);
              // 显示给用户的警告
              if (typeof ElMessage !== 'undefined') {
                ElMessage.warning({
                  message: '上传链接将在短时间内过期，正在加快上传速度...',
                  duration: 3000
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('预签名URL预验证失败:', error);
        // 不阻止上传，因为uploadFileWithPresignedUrl函数中会再次验证
      }
      
      // 2. 使用预签名URL上传文件
      const uploadResult = await uploadFileWithPresignedUrl(file, presignedUrl, file.size)
      
      // 3. 提交图片信息到后端
      // 实际提交代码
      console.log('使用真实API提交图片信息')
      
      // 确保file_key存在，如果不存在则使用文件名作为备选
      fileKey = fileKey || `file_${Date.now()}_${file.name}`;
      console.log('原始file_key:', fileKey);
      
      // 尝试构建完整的COS URL（与uploadFileToTencentCOS函数保持一致的逻辑）
      let fullCosUrl = fileKey;
      
      // 如果fileKey不包含完整URL格式，尝试构建完整URL
      if (!fileKey.startsWith('http://') && !fileKey.startsWith('https://')) {
        // 优先从presignedData构建
        if (presignedData.bucket && presignedData.region) {
          fullCosUrl = `https://${presignedData.bucket}.cos.${presignedData.region}.myqcloud.com/${fileKey}`;
        } 
        // 否则使用默认COS域名
        else {
          fullCosUrl = `https://attach-1377842862.cos.ap-chengdu.myqcloud.com/${fileKey}`;
        }
      }
      
      console.log('构建的完整COS URL:', fullCosUrl);
      
      // 支持从metadata中获取custom_name或customFile（注意：不使用custom_fileName）
      // 确保遵循后端API要求，使用custom_name而不是custom_fileName
      console.log('[字段处理] metadata中的字段检查:', {
        custom_name: metadata.custom_name,
        customFile: metadata.customFile,
        // 注意：不使用custom_fileName
        hasCustom_fileName: 'custom_fileName' in metadata
      });
      
      const customName = metadata.custom_name || metadata.customFile || '';
      console.log('[字段处理] 最终使用的custom_name值:', customName);
      
      const submissionData = {
        // 确保image_url字段始终存在并使用完整URL
        image_url: fullCosUrl, // 使用完整的COS URL
        file_key: fileKey,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        task_context: metadata.task_context || [],
        score: Number.isFinite(Number(metadata.score)) ? Number(metadata.score) : 80,
        tags: Array.isArray(metadata.tags) ? metadata.tags : [],
        annotations: Array.isArray(metadata.annotations) ? metadata.annotations : [],
        custom_name: customName, // 使用统一的custom_name字段
        client_id: metadata.client_id || (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)
      }
      
      console.log('准备提交图片信息:', submissionData)
      const result = await submitImage(submissionData)
      
      console.log('✅ 图片提交成功')
      if (typeof ElMessage !== 'undefined') {
        ElMessage.success('图片提交成功')
      }
      
      // 确保custom_name已正确提交到后端，现在直接从后端获取，不再需要本地存储
      console.log(`[数据提交] custom_name已提交到后端: ${metadata.custom_name || '未提供'}`);
      
      // 记录函数成功结束
      DebugUtils.logFunctionEnd('uploadAndSubmitImage', { success: true });
      return result
    } catch (error) {
      console.error('上传并提交图片失败:', error)
      
      // 分析错误并准备恢复选项
      const recoveryOptions = [];
      
      // 根据错误类型确定是否可以自动重试
      const canAutoRetry = 
        (error.isAborted || (error.message && error.message.includes('ERR_ABORTED'))) ||
        error.errorType === 'NETWORK_ERROR' ||
        error.errorType === 'TIMEOUT_ERROR' ||
        (error.message && error.message.includes('URL已过期')) ||
        (error.message && error.message.includes('网络错误'));
      
      if (canAutoRetry && retryCount < maxAutoRetries) {
        retryCount++;
        console.log(`将进行自动重试 ${retryCount}/${maxAutoRetries}`);
        
        // 显示重试信息
        if (typeof ElMessage !== 'undefined') {
          ElMessage.info({
            message: `上传遇到问题，正在第${retryCount}次尝试自动恢复...`,
            duration: 2000
          });
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        continue;
      }
      
      // 添加可能的恢复选项
      if (error.isAborted || error.errorType === 'NETWORK_ERROR') {
        recoveryOptions.push('检查网络连接后重试');
      }
      
      if (error.errorType === 'CORS_ERROR') {
        recoveryOptions.push('稍后重试或联系管理员');
      }
      
      if (error.message && error.message.includes('URL已过期')) {
        recoveryOptions.push('点击重试以获取新的上传链接');
      }
      
      // 显示用户友好的错误信息
      showUserFriendlyError(error, recoveryOptions);
      
      // 如果有恢复选项，包装错误以提供恢复机制
      if (recoveryOptions.length > 0) {
        error.recoveryOptions = recoveryOptions;
        error.canRetry = true;
      }
      
      // 注意：不再需要本地存储custom_name，失败时会通过后端重新获取
      if (metadata.custom_name && metadata.custom_name.trim()) {
        const customName = metadata.custom_name.trim();
        console.log(`[错误处理] 上传失败，但已记录custom_name: ${customName}，可在重试时重新提交`);
      }
    }
    
    ElMessage.error('提交图片失败：' + (error.message || '未知错误'))
    
    // 记录函数失败
    DebugUtils.logFunctionEnd('uploadAndSubmitImage', { 
      success: false, 
      error: error.message || '未知错误' 
    });
    
    throw error;
  }
}

/**
 * 获取提交列表
 * @param {Object} params - 查询参数
 * @returns {Promise} - 返回提交列表
 */
export async function getSubmissions(params = {}) {
  try {
    const queryString = new URLSearchParams(params).toString()
    const data = await apiRequest(`/submissions?${queryString}`, {
      method: 'GET'
    })
    return data
  } catch (error) {
    ElMessage.error('获取提交列表失败：' + (error.message || '未知错误'))
    throw error
  }
}

/**
 * 获取单个提交详情
 * @param {number} submissionId - 提交ID
 * @returns {Promise} - 返回提交详情
 */
export async function getSubmissionDetail(submissionId) {
  try {
    const data = await apiRequest(`/submissions/${submissionId}`, {
      method: 'GET'
    })
    return data
  } catch (error) {
    ElMessage.error('获取提交详情失败：' + (error.message || '未知错误'))
    throw error
  }
}

/**
 * 重命名提交的图片
 * @param {number} submissionId - 提交ID
 * @param {string} customName - 自定义名称
 * @returns {Promise} - 返回重命名结果
 */
export async function renameSubmissionImage(submissionId, customName) {
  try {
    console.log('[重命名API] 开始重命名提交图片:', { submissionId, customName })
    
    // 立即验证token是否存在
    const token = getToken();
    console.log('[重命名API] 当前Token状态:', token ? '存在，长度=' + token.length : '不存在')
    
    const payload = {
      submission_id: submissionId,
      custom_name: customName
    }
    
    console.log('[重命名API] 请求载荷:', JSON.stringify(payload))
    console.log('[重命名API] 准备调用apiRequest')
    
    // 直接使用fetch而不是apiRequest来隔离问题
    const response = await fetch(`${API_BASE}/submissions/rename`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : 'Bearer (empty)'
      },
      body: JSON.stringify(payload)
    })
    
    console.log('[重命名API] 直接fetch响应状态:', response.status)
    console.log('[重命名API] 响应状态文本:', response.statusText)
    
    const responseText = await response.text();
    console.log('[重命名API] 原始响应内容:', responseText)
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('[重命名API] 解析后的JSON响应:', data)
    } catch (e) {
      console.error('[重命名API] 解析JSON失败:', e)
      throw new Error('无效的响应格式')
    }
    
    if (data.code === 0) {
      ElMessage.success('图片重命名成功')
      console.log('[重命名API] 重命名成功:', data)
      return data
    } else {
      console.error('[重命名API] 重命名失败:', data)
      throw new Error(data.message || '重命名失败')
    }
  } catch (error) {
    console.error('[重命名API] 重命名失败详情:', error.message || error)
    if (error.stack) {
      console.error('[重命名API] 错误堆栈:', error.stack)
    }
    ElMessage.error('图片重命名失败：' + (error.message || '未知错误'))
    throw error
  }
}

export default {
  submitImage,
  uploadAndSubmitImage,
  getSubmissions,
  getSubmissionDetail,
  renameSubmissionImage
}