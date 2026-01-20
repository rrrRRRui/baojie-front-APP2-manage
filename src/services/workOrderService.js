// src/services/workOrderService.js
import { ElMessage } from 'element-plus'

// API基础URL（确认就是/v1）
const API_BASE = '/v1'
const getToken = () => localStorage.getItem('token') || ''

// 通用API请求函数（保持与现有代码一致）
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

        if (contentType && !requestHeaders['Content-Type']) {
            requestHeaders['Content-Type'] = contentType
        }

        const url = `${API_BASE}${path}`
        console.log(`[API请求] ${method} ${url}`)

        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body,
            cache: 'no-store',
            signal: ctrl.signal
        })

        if (response.status === 401) {
            ElMessage.error('登录已过期，请重新登录')
            throw new Error('401 Unauthorized')
        }

        const data = await response.json()

        if (data.code !== 0) {
            throw new Error(data.message || '请求失败')
        }

        return data
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('请求超时')
        }
        ElMessage.error(error.message || '请求失败')
        throw error
    } finally {
        clearTimeout(timer)
    }
}

// ==================== APP端API ====================

/**
 * 2.5 获取AI评分结果C ：分数展示+合格状态标识
 * @param {number} workOrderId - 工单ID
 * @returns {Promise} - 评分结果
 */
export async function getAIScoreResult(workOrderId) {

    // 添加查询参数传递
    const queryString = Object.keys(params).length > 0
        ? '?' + new URLSearchParams(params).toString()
        : ''

    return apiRequest(`/app/work-orders/${workOrderId}/scores`, {
        method: 'GET'
    })
}

/**
 * 2.6 复扫处理C :不合格触发复扫+重新上传流程
 * @param {number} workOrderId - 工单ID
 * @param {Object} data - 复扫原因 { reason: string }
 * @returns {Promise} - 复扫结果
 */
export async function processRescan(workOrderId, data) {
    return apiRequest(`/app/work-orders/${workOrderId}/rescan`, {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

/**
 * 2.2 获取工单详情A（需要获取工单基本信息）
 * @param {number} workOrderId - 工单ID
 * @returns {Promise} - 工单详情
 */
export async function getWorkOrderDetail(workOrderId) {
    return apiRequest(`/app/work-orders/${workOrderId}`, {
        method: 'GET'
    })
}

// ==================== 管理后台API ====================

/**
 * 3.6 获取AI评分管理C - 你的任务：评分结果查看+明细展示
 * @param {Object} params - 查询参数
 * @returns {Promise} - 评分管理数据
 */
export async function getAIScoreManagement(params = {}) {
    return apiRequest('/admin/scores/management', {
        method: 'GET'
    })
}

export default {
    // APP端
    getAIScoreResult,
    processRescan,
    getWorkOrderDetail,

    // 管理后台
    getAIScoreManagement
}