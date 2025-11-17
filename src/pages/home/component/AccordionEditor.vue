<template>
  <div class="acc-editor">
    <!-- 工具条：搜索 + 展开/收起 -->
    <div class="acc-toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索二级节点名称…"
        clearable
        class="w240"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <div class="spacer" />

      <el-button size="small" @click="expandAll"   :disabled="!filteredChildren.length">展开全部</el-button>
      <el-button size="small" @click="collapseAll" :disabled="!filteredChildren.length">收起全部</el-button>
      <el-tag v-if="filteredChildren.length" size="small" effect="plain" round class="ml8">
        共 {{ filteredChildren.length }} 组
      </el-tag>
    </div>

    <el-collapse v-model="activeNames" class="acc-collapse">
      <el-collapse-item
        v-for="(child, idx) in filteredChildren"
        :key="idx"
        :name="String(idx)"
      >
        <!-- 分组标题（可编辑） -->
        <template #title>
          <div class="grp-title">
            <!-- 二级节点标题编辑框（只在这里出现，NodeEditor 内部隐藏自身输入） -->
            <el-input
              v-model="child.inputValue"
              size="small"
              class="grp-input"
              placeholder="二级名称"
            />
            <el-tag size="small" round class="ml8" effect="plain">子项：{{ child.options?.length || 0 }}</el-tag>
            <el-tag size="small" round type="success" class="ml6 light">叶：{{ countLeaves(child) }}</el-tag>
          </div>
        </template>

        <!-- 分组内容：L2 专属外观容器（与 3 级的 NodeEditor 外观区分开） -->
        <div class="l2-group-card">
          <div class="l2-card-head">
            <div class="dot"></div>
            <div class="head-title">{{ child.inputValue || '未命名二级' }}</div>
          </div>
          <div class="l2-card-body">
            <!-- 这里继续用 NodeEditor 递归编辑 3/4/5 级；自身输入隐藏 -->
            <NodeEditor :node="child" :hideSelfInput="true" />
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>

    <el-empty
      v-if="!filteredChildren.length"
      description="未找到匹配的二级节点"
      :image-size="80"
      class="mt12"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import NodeEditor from './NodeEditor.vue'

const props = defineProps({
  node: { type: Object, required: true } // 当前 Level-1 节点
})

/** 展开收起的受控状态 */
const activeNames = ref([])

/** 关键字过滤（不再自动展开/收起，只控制过滤集合） */
const keyword = ref('')

/** 数据源 */
const children = computed(() =>
  Array.isArray(props.node?.options) ? props.node.options : []
)

/** 过滤后二级列表（不碰 activeNames） */
const filteredChildren = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return children.value
  return children.value.filter(ch => (ch.inputValue || '').toLowerCase().includes(kw))
})

/** 按钮：展开/收起全部 */
const expandAll   = () => { activeNames.value = filteredChildren.value.map((_, i) => String(i)) }
const collapseAll = () => { activeNames.value = [] }

/** 叶子计数（递归） */
const countLeaves = (node) => {
  if (!node || !Array.isArray(node.options) || !node.options.length) return 0
  let sum = 0
  for (const ch of node.options) {
    if (Array.isArray(ch.options) && ch.options.length) sum += countLeaves(ch)
    else sum += 1
  }
  return sum
}

/** 当二级节点集合变更时，默认不自动展开，保持用户当前展开状态 */
watch(children, () => {
  // 可根据需要选择清空展开状态；此处保持不变。
  // activeNames.value = []
})
</script>

<style scoped>
.acc-editor { display: block; }

/* 工具条 */
.acc-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.spacer { flex: 1; }
.w240 { width: 240px; }
.ml8 { margin-left: 8px; }
.ml6 { margin-left: 6px; }
.mt12 { margin-top: 12px; }

/* 折叠面板（L2 容器） */
.acc-collapse :deep(.el-collapse-item__header) {
  height: 44px;
  line-height: 44px;
  padding: 0 12px;
  background: #fafcff;
  border: 1px solid #edf1f7;
  border-radius: 8px;
  margin-top: 8px;
}
.acc-collapse :deep(.el-collapse-item__wrap) {
  border: none;                  /* 去掉默认 wrap 边框，下面自定义卡片外观 */
  background: transparent;
}

/* 分组标题 */
.grp-title { display: flex; align-items: center; }
.grp-input { width: 260px; }

/* —— L2 专属展示框 —— */
.l2-group-card {
  margin: 8px 0 4px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e8edf7;
  background:
    linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  box-shadow: 0 6px 20px rgba(9, 30, 66, 0.05);
}

/* L2 头部条与 3 级不同的视觉 */
.l2-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  background: linear-gradient(90deg, #f0f6ff 0%, #ffffff 100%);
  border-bottom: 1px solid #eef2f8;
}
.l2-card-head .dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #1890ff;
  box-shadow: 0 0 0 3px rgba(24,144,255,.15);
}
.l2-card-head .head-title {
  font-weight: 600;
  color: #2b3a55;
  letter-spacing: .2px;
}

/* L2 主体（这里放 NodeEditor 的递归） */
.l2-card-body {
  padding: 12px;
  background: #fff;
  border-radius: 0 0 12px 12px;
}

/* 轻量 tag 外观 */
.light { background: #f6ffed; border-color: #b7eb8f; color: #389e0d; }
</style>
