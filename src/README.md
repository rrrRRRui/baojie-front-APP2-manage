这是一个完整的保洁项目AI评分模块，包含APP端和管理后台两个部分，实现了从AI评分展示到复扫闭环处理的完整流程。

模块组成

APP端模块
AIScoreResult.vue - AI评分结果展示页面
分数展示与合格状态标识
评分明细查看
清洁图片预览
不合格时触发复扫流程

RescanProcess.vue - 复扫闭环处理页面
填写复扫原因
重新上传清洁图片
提交复扫请求
状态反馈


管理后台模块
ScoreManagement.vue - AI评分管理主页面
评分结果列表查看
多条件筛选（工单、人员、日期等）
数据统计卡片（合格率、平均分等）
分页与排序功能

ScoreDetail.vue - 评分明细展示页面
工单详细信息展示
各项评分明细
清洁图片查看
复扫记录时间线



技术栈
框架: Vue 3 + Composition API
UI组件库: Element Plus
路由: Vue Router 4
状态管理: Vue Reactive API
HTTP客户端: Fetch API



功能特性
APP端功能
评分展示
分数醒目展示
合格/不合格状态标识
评分时间与人员信息
复扫闭环
不合格自动触发复扫
多图上传功能
实时上传进度
提交成功反馈
图片管理
图片预览与缩放
多图上传（最多9张）
图片删除与重传
管理后台功能
数据管理
多条件复合查询
表格排序与分页
数据导出功能
实时统计数据
详情查看
完整的评分明细
问题图片查看
复扫记录追溯
时间线展示



文件结构
text
cleaning-ai-module/
├── app/                          # APP端模块
│   ├── AIScoreResult.vue         # 评分结果页面
│   └── RescanProcess.vue         # 复扫处理页面
├── admin/                        # 管理后台模块
│   ├── ScoreManagement.vue       # 评分管理主页面
│   └── ScoreDetail.vue          # 评分详情页面
├── services/
│   └── workOrderService.js      # API服务接口
├── router/                       # 路由配置
│   ├── appRoutes.js             # APP端路由
│   └── adminRoutes.js           # 管理后台路由
├── package.json                  # 项目依赖
└── README.md                    # 项目说明



API接口说明
APP端接口
javascript
// 获取AI评分结果
GET /app/work-orders/{id}/scores

// 提交复扫请求
POST /app/work-orders/{id}/rescan

// 获取工单详情
GET /app/work-orders/{id}
管理后台接口
javascript
// 获取评分管理列表
GET /admin/scores/management
参数: page, pageSize, order_no, cleaner_username, is_qualified, start_date, end_date
快速开始
1. 安装依赖
bash
npm install element-plus vue-router
2. 配置路由
javascript
// 在项目的router/index.js中引入
import { appRoutes, adminRoutes } from './router'

const routes = [
  ...appRoutes,
  ...adminRoutes
]
3. 配置API服务
javascript
// 根据实际后端地址修改API_BASE
const API_BASE = '/v1'  // 或你的实际API地址
4. 添加页面入口
在主页添加导航入口：

html
<!-- 管理后台入口 -->
<router-link to="/admin/scores">AI评分管理</router-link>

<!-- APP端入口（示例） -->
<router-link :to="`/app/scores/${workOrderId}`">查看评分</router-link>




核心组件说明
1. AIScoreResult.vue
使用响应式设计，适配移动端

分数展示采用视觉化设计

不合格状态突出显示

图片预览功能

2. RescanProcess.vue
表单验证与提交

图片上传与管理

进度反馈机制

错误处理

3. ScoreManagement.vue
表格组件与分页

复合查询条件

数据统计展示

导出功能

4. ScoreDetail.vue
详细信息展示

时间线组件

图片画廊

数据格式化

配置说明
环境变量
javascript
// API基础地址配置
const API_BASE = import.meta.env.VITE_API_BASE || '/v1'

// 图片上传限制
const MAX_IMAGE_SIZE = 5 * 1024 * 1024  // 5MB
const MAX_IMAGE_COUNT = 9

// 合格分数阈值
const QUALIFIED_SCORE = 60
样式定制
组件支持通过CSS变量进行样式定制：

css
:root {
  --primary-color: #1890ff;
  --success-color: #52c41a;
  --warning-color: #faad14;
  --danger-color: #ff4d4f;
}
业务逻辑说明
评分流程
text
保洁完成 → AI评分 → 显示结果 → 合格/不合格判断 → 
不合格触发复扫 → 重新上传图片 → 重新评分 → 完成闭环
合格标准
≥60分：合格（显示绿色）

<60分：不合格（显示红色，触发复扫）

复扫规则
只有不合格的工单可以发起复扫

复扫需要填写原因

必须上传新的清洁图片

复扫后重新进行AI评分

开发说明
开发环境
bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build



代码规范
使用ESLint + Prettier进行代码格式化

组件使用Composition API编写

使用TypeScript进行类型检查（可选）

遵循Vue 3最佳实践

测试数据
组件内置了模拟数据，便于开发和测试：

javascript
// 在开发环境中使用模拟数据
if (import.meta.env.DEV) {
  // 使用模拟API响应
}
部署说明
构建配置
javascript
// vite.config.js
export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})



故障排除

常见问题
图片上传失败

检查文件大小限制

检查网络连接

确认服务器存储空间

API请求失败

检查API地址配置

验证Token有效性

查看网络控制台

路由问题

检查路由配置

确认History模式支持

检查base路径设置




更新日志
v1.0.0 (2024-01)
✅ 完成APP端AI评分结果模块

✅ 完成APP端复扫闭环模块

✅ 完成管理后台评分管理模块

✅ 实现完整的业务逻辑流程

✅ 添加详细的文档说明

提示: 在实际部署前，请确保：

配置正确的API地址

设置合适的权限控制

进行充分的测试

配置生产环境变量



