# 保洁APP前端

基于Vue3 + Vite构建的保洁服务管理应用，主要功能包括现场拍照上传。

## 功能特性

### 📷 拍照上传模块
- **多种拍照方式**：支持现场拍摄和相册选择
- **多张上传**：一次可选择多张图片（最多9张）
- **实时进度**：上传进度可视化展示
- **失败重试**：上传失败可单独重试
- **图片预览**：上传前可预览选中的图片
- **文件管理**：可删除不需要的图片

### 🔧 技术特性
- 响应式设计，适配移动端
- TypeScript类型安全
- Pinia状态管理
- Vue Router路由管理
- 图片压缩优化
- 文件大小限制（10MB）

## 项目结构

```
src/
├── components/          # 组件
│   └── PhotoUploader.vue   # 拍照上传组件
├── stores/             # 状态管理
│   └── upload.ts          # 上传状态管理
├── types/              # 类型定义
│   └── upload.ts          # 上传相关类型
├── utils/              # 工具函数
│   └── imageUtils.ts      # 图片处理工具
├── views/              # 页面
│   ├── Home.vue           # 主页
│   └── PhotoUpload.vue    # 拍照上传页面
├── router/             # 路由配置
│   └── index.ts
├── App.vue             # 根组件
├── main.ts             # 入口文件
└── style.css           # 全局样式
```

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 使用说明

### 拍照上传流程
1. 进入"现场拍照"页面
2. 选择"拍照"或"相册"按钮
3. 选择或拍摄图片
4. 预览选中的图片
5. 点击"上传所有图片"开始上传
6. 查看上传进度和结果
7. 失败的图片可点击"重试"

### 配置选项
在 `PhotoUploader.vue` 组件中可以配置：
- `maxSize`: 最大文件大小（默认10MB）
- `maxCount`: 最大文件数量（默认9张）
- `quality`: 图片压缩质量（默认0.8）

## API集成

当前使用模拟上传，实际使用时需要：

1. 修改 `src/stores/upload.ts` 中的上传逻辑
2. 替换模拟的上传API调用
3. 处理服务器返回的响应

```typescript
// 示例API调用
const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})
const result = await response.json()
```

## 浏览器兼容性

- Chrome 60+
- Safari 12+
- Firefox 60+
- Edge 79+

## 注意事项

1. 需要HTTPS环境才能使用相机功能
2. 移动端需要用户授权相机权限
3. 图片会自动压缩以减少上传时间
4. 支持JPEG、PNG、WebP等常见图片格式