// 临时测试API调用
async function testPresignedUrlApi() {
  try {
    console.log('开始测试预签名URL API...');
    
    // 直接测试fetch调用
    const response = await fetch('/v1/cos/put-presigned-url', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test_token' // 使用测试token
      }
    });
    
    console.log('API返回状态:', response.status);
    const data = await response.json();
    console.log('API返回数据:', data);
    
    return { success: true, data };
  } catch (error) {
    console.error('API测试失败:', error);
    return { success: false, error: error.message };
  }
}

// 导出测试函数
export default {
  testPresignedUrlApi
};