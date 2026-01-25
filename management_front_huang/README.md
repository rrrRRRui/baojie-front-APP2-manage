# 管理后台系统

基于 Vue 3 + Vite + Element Plus 构建的现代化管理后台系统。

## 功能特性

### 工单全量管理模块
- ✅ 多条件筛选（工单编号、状态、优先级、时间范围）
- ✅ 工单详情查看
- ✅ 证据图片预览
- ✅ 工单状态管理
- ✅ 处理记录跟踪

### 统计报表模块
- ✅ 日/周/月报表生成
- ✅ 数据可视化图表
- ✅ 排行统计功能
- ✅ Excel导出功能
- ✅ 多维度数据分析

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **图表库**: ECharts + Vue-ECharts
- **HTTP客户端**: Axios
- **Excel导出**: SheetJS

## 项目结构

```
src/
├── components/          # 公共组件
├── layout/             # 布局组件
├── router/             # 路由配置
├── stores/             # 状态管理
├── utils/              # 工具函数
├── views/              # 页面组件
│   ├── dashboard/      # 仪表盘
│   ├── tickets/        # 工单管理
│   └── reports/        # 统计报表
├── App.vue             # 根组件
└── main.js             # 入口文件
```

## 开发指南

### 环境要求
- Node.js >= 16
- npm >= 8

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 主要页面

### 1. 仪表盘 (`/dashboard`)
- 工单统计概览
- 趋势图表展示
- 快速数据洞察

### 2. 工单管理 (`/tickets`)
- **工单列表** (`/tickets/list`): 支持多条件筛选的工单列表
- **工单详情** (`/tickets/detail/:id`): 详细的工单信息和处理记录

### 3. 统计报表 (`/reports`)
- **数据统计** (`/reports/statistics`): 多维度统计分析和图表展示
- **排行统计** (`/reports/ranking`): 各类排行榜和绩效分析

## 核心功能

### 工单筛选
支持按以下条件筛选工单：
- 工单编号
- 工单状态（待分配、处理中、已完成、已关闭）
- 优先级（低、中、高、紧急）
- 创建时间范围

### 图片预览
- 支持多张证据图片上传
- 点击图片可放大预览
- 支持图片轮播查看

### 数据导出
- 支持Excel格式导出
- 可导出统计报表和排行数据
- 自定义导出文件名

### 响应式设计
- 适配不同屏幕尺寸
- 移动端友好的界面设计

## 数据模拟

项目使用模拟数据进行演示，实际使用时需要：
1. 配置后端API接口
2. 修改 `src/utils/request.js` 中的请求配置
3. 替换各组件中的模拟数据为真实API调用

## 自定义配置

### 环境变量
在 `.env` 文件中配置：
- `VITE_APP_TITLE`: 应用标题
- `VITE_API_BASE_URL`: API基础地址

### 主题定制
可通过修改Element Plus主题变量来自定义界面样式。

## 浏览器支持

- Chrome >= 87
- Firefox >= 78
- Safari >= 14
- Edge >= 88

## 许可证

MIT License