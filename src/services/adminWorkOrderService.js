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

    // 管理后台
    getAIScoreManagement
}



/**
 * 1. AI打分接口（上传图片获取分数）
 * @param {File} imageFile - 图片文件
 * @param {string} scenario - 场景类型
 */
export async function getAIScore(imageFile, scenario) {
    const formData = new FormData()
    formData.append('file', imageFile)
    formData.append('scenario', scenario)

    return apiRequest('/app/ai/scoring', {
        method: 'POST',
        body: formData,
        contentType: null  // 重要：让浏览器自动设置
    })
}

/**
 * 2. 保存评分接口
 * @param {number} workOrderId - 工单ID
 * @param {number} score - 分数
 */
export async function saveAIScore(workOrderId, score) {
    return apiRequest(`/app/work-orders/${workOrderId}/ai-scoring`, {
        method: 'POST',
        body: JSON.stringify({ score: score })
    })
}