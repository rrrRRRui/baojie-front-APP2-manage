<template>
  <!-- 自身输入框（根节点可隐藏） -->
  <div v-if="!hideSelfInput" :class="['node-line','indent-'+node.level]">
    <!-- ⭐ 点击输入框才弹提示；平时完全隐藏 -->
    <el-popover
        trigger="click"
        placement="right-start"
        :width="120"
    >
      <!-- Popover 内容 -->
      <template #default>
        当前是 <b>{{ placeholders[node.level - 1] }} Tab</b>
      </template>

      <!-- 触发器：输入框 -->
      <template #reference>
        <el-input
            v-model="node.inputValue"
            size="small"
            class="node-input"
            :placeholder="'请输入' + placeholders[node.level-1] + 'Tab名称'"
        />
      </template>
    </el-popover>

    <div class="node-actions">
      <el-link size="small" type="info" v-if="node.level>1" @click="removeSelf">删除此项</el-link>
      <el-link size="small" type="primary" :disabled="node.level>=maxLevel" @click="addChild">新增子项</el-link>
    </div>
  </div>

  <!-- 子节点始终渲染 -->
  <NodeEditor
      v-for="(child,i) in node.options"
      :key="i"
      :node="child"
      :maxLevel="maxLevel"
      @remove="node.options.splice(node.options.indexOf($event),1)"
  />
</template>

<script setup>
import {ref} from 'vue'
import {ElMessageBox} from 'element-plus'

const props = defineProps({
  node: Object,
  maxLevel: {type: Number, default: 4},
  hideSelfInput: {type: Boolean, default: false}
})

const emit = defineEmits(['remove'])

const placeholders = ['一级', '二级', '三级', '四级']

/* ⭐ 聚焦高亮功能 */
const isFocused = ref(false)
const onFocus = () => {
  isFocused.value = true
}
const onBlur = () => {
  isFocused.value = false
}

const addChild = () => {
  if (props.node.level >= props.maxLevel) return
  // 需要从父组件传入 createNode 函数或在组件内定义
  const newNode = {
    level: props.node.level + 1,
    inputValue: '',
    options: []
  }
  props.node.options.push(newNode)
}

const removeSelf = () => {
  ElMessageBox.confirm(
      '确定删除该子项吗？',      // 内容
      '提示',                   // 标题
      {type: 'warning'}       // 警告色按钮
  ).then(() => {
    emit('remove', props.node)   // 真正删除
  }).catch(() => { /* 点击取消 */
  });
}
</script>

<style scoped>
/* 从 control.css 中提取相关样式 */
.node-line {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
  gap: 18px;
}

.node-input {
  flex: 1;
}

.node-input .el-input__wrapper {
  font-size: 14px;
}

.node-actions {
  flex-shrink: 0;
  display: flex;
  gap: 12px;
}

/* Element Plus 链接按钮微调 */
.el-link--inner {
  font-size: 13px;
  line-height: 1;
}

/* ----------------------
   多级缩进
---------------------- */
.indent-1 {
  margin-left: 0;
}

.indent-2 {
  margin-left: 24px;
}

.indent-3 {
  margin-left: 48px;
}

.indent-4 {
  margin-left: 72px;
}

/* ----------------------
   响应式
---------------------- */
@media (max-width: 600px) {
  .indent-2 {
    margin-left: 16px;
  }

  .indent-3 {
    margin-left: 32px;
  }

  .indent-4 {
    margin-left: 48px;
  }
}
</style>