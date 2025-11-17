<template>
  <div class="page-wrapper">

    <!-- 顶部：横向分选栏 -->
    <el-tabs v-model="activeKey" type="card" class="l1-tabs" @tab-click="onTabClick">
      <el-tab-pane
        v-for="(r, i) in roots"
        :key="i"
        :name="String(i)"
      >
        <!-- 自定义标签内容 -->
        <template #label>
          <div class="tab-label">
            <el-icon class="tab-icon"><OfficeBuilding /></el-icon>
            <span class="tab-title">{{ getTitle(r, i) }}</span>
            <el-tag size="small" round effect="plain" class="tab-badge">
              L2:{{ countL2(r) }}
            </el-tag>
            <el-tag size="small" round class="tab-badge leaf">
              叶：{{ countLeaves(r) }}
            </el-tag>
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- 当前项目的标题编辑（只改当前 Level-1 的名字）-->
    <div v-if="currentRoot" class="l1-title-row">
      <span class="label">项目名称：</span>
      <el-input
        v-model="currentRoot.inputValue"
        placeholder="输入项目名称（Level-1）"
        style="width: 320px;"
      />
      <el-button type="primary" link @click="addRoot" style="margin-left:16px">
        新增项目
      </el-button>
      <el-button type="danger" link @click="removeCurrent" :disabled="roots.length<=1">
        删除当前项目
      </el-button>
    </div>

    <!-- 选中的 Level-1 的子层级（折叠分组编辑） -->
    <div v-if="currentRoot" class="editor-shell">
      <AccordionEditor :node="currentRoot" />
    </div>

    <el-empty v-else description="暂无项目，请先新增或重新拉取" />

    <el-divider />

    <!-- 底部动作 -->
    <div class="form-actions">
      <button class="btn-repull" @click="load">重新拉取</button>
      <button class="btn-import" @click="openImport">载入 TXT</button>
      <button class="btn-save"   @click="submit" :disabled="!roots.length">保存</button>
    </div>

    <!-- 导入弹窗 -->
    <el-dialog v-model="importVisible" title="载入场景结构(TXT / JSON)" width="640px">
      <div class="import-row">
        <el-upload
          drag
          action=""
          :auto-upload="false"
          :file-list="fileList"
          :on-change="onFileChange"
          accept=".txt,.json"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            拖拽 TXT/JSON 到此，或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持两种格式：<br/>
              ① 每行一个路径：<code>卫生间 &gt; 墙面 &gt; 瓷砖墙面</code><br/>
              ② JSON 数组（与 /all_scenes 返回一致，或 { data:[...] }）
            </div>
          </template>
        </el-upload>
      </div>

      <el-input
        v-model="importText"
        type="textarea"
        :rows="10"
        placeholder="或直接粘贴文本……"
        class="mt-3"
      />

      <div class="mt-3" style="display:flex;align-items:center;gap:12px;">
        <span style="color:#666;">导入策略：</span>
        <el-radio-group v-model="importMode">
          <el-radio-button label="replace">覆盖现有</el-radio-button>
          <el-radio-button label="merge">合并追加</el-radio-button>
        </el-radio-group>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importVisible=false">取消</el-button>
          <el-button type="primary" @click="handleImport">开始导入</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { OfficeBuilding, UploadFilled } from '@element-plus/icons-vue'

import AccordionEditor from './component/AccordionEditor.vue'
import NodeEditor from './component/NodeEditor.vue' // 仍可保留，Accordion 内部会用到

/* ============== 标签点击反馈（可选） ============== */
const onTabClick = (pane) => {
  const idx = Number(pane.paneName)
  const r = roots.value[idx]
  if (r) ElMessage.success(`已切换到：${getTitle(r, idx)}`)
}

/* ================= 文件导入 ================= */
const importVisible = ref(false)
const importText    = ref('')
const fileList      = ref([])
const importMode    = ref('replace') // 'replace' | 'merge'

const openImport = () => {
  importVisible.value = true
  importText.value = ''
  fileList.value = []
  importMode.value = 'replace'
}
const onFileChange = (file) => {
  const raw = file.raw
  if (!raw) return
  const reader = new FileReader()
  reader.onload  = () => {
    importText.value = String(reader.result || '')
    ElMessage.success(`已读取：${raw.name}`)
  }
  reader.onerror = () => ElMessage.error('读取文件失败')
  reader.readAsText(raw, 'utf-8')
}
const handleImport = () => {
  try {
    const parsed = parseTextToRoots(importText.value)
    if (!parsed.length) throw new Error('未解析到任何节点，请检查文件格式')

    if (importMode.value === 'replace') {
      roots.value = parsed
      activeKey.value = '0'
    } else {
      const tmp = JSON.parse(JSON.stringify(roots.value))
      mergeTrees(tmp, parsed)
      roots.value = tmp
    }
    importVisible.value = false
    ElMessage.success(`导入成功，共 ${roots.value.length} 个项目`)
  } catch (e) {
    ElMessage.error('导入失败：' + e.message)
  }
}

/* ================= 文本解析 / 合并 ================= */
function parseTextToRoots(txt) {
  const text = (txt || '').trim()
  if (!text) return []

  // 1) JSON 优先
  try {
    const j = JSON.parse(text)
    const arr = Array.isArray(j?.data) ? j.data : (Array.isArray(j) ? j : null)
    if (arr) return arr.map(fromServerNode)
  } catch (_) { /* 非 JSON，继续 */ }

  // 2) 文本路径：每行一个路径，分隔符支持 ">", "/", tab 或 2+ 空格
  const rootsMap = new Map()
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    const segs = line
      .split(/>|\/|\t| {2,}/)
      .map(s => s.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean)
    if (!segs.length) continue

    const first = segs[0]
    let root = rootsMap.get(first)
    if (!root) {
      root = createNode(1)
      root.inputValue = first
      rootsMap.set(first, root)
    }
    let parent = root
    for (let i = 1; i < segs.length; i++) {
      const name = segs[i]
      let child = (parent.options || []).find(o => (o.inputValue || '').trim() === name)
      if (!child) {
        child = createNode((parent.level || 1) + 1)
        child.inputValue = name
        parent.options.push(child)
      }
      parent = child
    }
  }
  return Array.from(rootsMap.values())
}

function mergeTrees(targetRoots, incomingRoots) {
  const nameMap = (opts = []) => {
    const m = new Map()
    for (const n of opts) m.set((n.inputValue || '').trim(), n)
    return m
  }
  const dfsMerge = (t, a) => {
    const tMap = nameMap(t.options)
    for (const an of a.options || []) {
      const key = (an.inputValue || '').trim()
      const exist = tMap.get(key)
      if (exist) {
        if (!Array.isArray(exist.options)) exist.options = []
        if (Array.isArray(an.options) && an.options.length) dfsMerge(exist, an)
      } else {
        t.options.push(JSON.parse(JSON.stringify(an)))
      }
    }
  }
  const tMap = nameMap(targetRoots)
  for (const ar of incomingRoots) {
    const key = (ar.inputValue || '').trim()
    const tRoot = tMap.get(key)
    if (tRoot) dfsMerge(tRoot, ar)
    else targetRoots.push(JSON.parse(JSON.stringify(ar)))
  }
  const fix = (n, lv = 1) => {
    n.level = lv
    for (const ch of n.options || []) fix(ch, lv + 1)
  }
  for (const r of targetRoots) fix(r, 1)
}

/* ================= 公共 API 工具 ================= */
const API_BASE = '/api/v1'
async function api(url, opt = {}) {
  const token = localStorage.getItem('token')
  return fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(opt.headers || {})
    },
    ...opt
  }).then(r => r.json())
}

/* ================= 数据模型 ================= */
function createNode(level = 1) {
  return { level, inputValue: '', options: [] }
}
function fromServerNode(sv) {
  const node = createNode(Number(sv.level) || 1)
  node.inputValue = sv.inputValue ?? sv.name ?? ''
  const kids = sv.options ?? sv.children ?? []
  node.options = Array.isArray(kids) ? kids.map(fromServerNode) : []
  return node
}

const roots = ref([])    // Level-1 列表
const activeKey = ref('0')

const currentIndex = computed(() =>
  Math.min(Number(activeKey.value) || 0, Math.max(roots.value.length - 1, 0))
)
const currentRoot  = computed(() => roots.value[currentIndex.value])

/* ============== 标签展示工具 ============== */
const getTitle = (r, i) => r?.inputValue?.trim() || `未命名${i + 1}`
const countL2 = (root) => Array.isArray(root?.options) ? root.options.length : 0
const countLeaves = (node) => {
  if (!node || !Array.isArray(node.options) || !node.options.length) return 0
  let sum = 0
  for (const ch of node.options) {
    if (Array.isArray(ch.options) && ch.options.length) sum += countLeaves(ch)
    else sum += 1
  }
  return sum
}

/* ================= 拉取 / 保存 ================= */
const load = async () => {
  try {
    // 保存加载中的消息实例
    const loadingMessage = ElMessage.info('正在拉取项目列表…')
    
    const res  = await api('/all_scenes')
    const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    if (!Array.isArray(list)) throw new Error('返回格式错误')

    const l1 = list.map(fromServerNode)
    roots.value = l1.length ? l1 : [createNode(1)]
    activeKey.value = '0'
    
    // 手动关闭加载中的消息，然后显示成功消息
    ElMessage.closeAll()
    ElMessage.success('已加载 Level-1 项目列表')
  } catch (e) {
    // 发生错误时也手动关闭加载中的消息
    ElMessage.closeAll()
    ElMessage.error('重新拉取失败：' + e.message)
  }
}

const submit = async () => {
  try {
    ElMessage.info('正在保存…')
    const payload = JSON.parse(JSON.stringify(roots.value))
    const res = await api('/all_scenes', { method: 'POST', body: JSON.stringify(payload) })
    if (res.code === 0) ElMessage.success('保存成功')
    else throw new Error(res.message || '保存失败')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

/* ================= 顶层项目操作 ================= */
const addRoot = () => {
  ElMessage.success('已新增空项目')
  roots.value.push(createNode(1))
  activeKey.value = String(roots.value.length - 1)
}
const removeCurrent = () => {
  if (!roots.value.length) return
  const idx = currentIndex.value
  ElMessageBox.confirm('确定删除当前项目(Level-1)及其全部子项吗？', '提示', { type: 'warning' })
    .then(() => {
      roots.value.splice(idx, 1)
      activeKey.value = String(Math.max(idx - 1, 0))
      if (!roots.value.length) {
        roots.value.push(createNode(1))
        activeKey.value = '0'
        ElMessage.warning('项目已清空，已自动创建一个空项目')
      } else {
        ElMessage.success('已删除')
      }
    })
    .catch(() => { ElMessage.info('已取消删除') })
}

/* ================= 生命周期 ================= */
onMounted(load)
</script>

<style scoped>
.page-wrapper {
  max-width: 1000px;
  margin: 24px auto 64px;
  padding: 0 16px;
}
.page-title { font-size: 20px; font-weight: 600; margin-bottom: 12px; }

/* Tabs */
.l1-tabs {
  --tab-bg:           #f6f8fb;
  --tab-hover-bg:     #eef2f8;
  --tab-active-bg:    #ffffff;
  --tab-active-ring:  rgba(24,144,255,.15);
  --tab-text:         #4a5568;
  --tab-text-active:  #1890ff;
  --tab-border:       #e8edf3;
}
.l1-tabs :deep(.el-tabs__header) {
  background: var(--tab-bg);
  padding: 8px 10px;
  border: 1px solid var(--tab-border);
  border-radius: 14px;
  margin-bottom: 14px;
}
.l1-tabs :deep(.el-tabs__nav-wrap) { margin-bottom: 0 !important; }
.l1-tabs :deep(.el-tabs__nav) { border: none !important; }
.l1-tabs :deep(.el-tabs__item) {
  margin: 4px 6px;
  border-radius: 999px;
  border: 1px solid transparent;
  transition: all .18s ease;
  padding: 6px 12px !important;
  color: var(--tab-text);
  background: transparent;
}
.l1-tabs :deep(.el-tabs__item:hover) { background: var(--tab-hover-bg); }
.l1-tabs :deep(.el-tabs__item.is-active) {
  color: var(--tab-text-active);
  background: var(--tab-active-bg);
  border-color: var(--tab-border);
  box-shadow: 0 0 0 3px var(--tab-active-ring);
}
.tab-label { display: inline-flex; align-items: center; gap: 8px; }
.tab-icon { font-size: 16px; opacity: .85; }
.tab-title { font-weight: 600; letter-spacing: .2px; }
.tab-badge { border-radius: 999px; line-height: 1; padding: 0 8px; border: 1px solid #e5eefb; }
.tab-badge.leaf { background: #e6f7ff; border-color: #bae7ff; color: #1890ff; }

/* 标题行 & 编辑卡片 */
.l1-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 12px;
  margin: 12px 0 18px;
}
.l1-title-row .label { color: #666; width: 80px; text-align: right; }

.editor-shell {
  border: 1px solid #edf1f7;
  background: linear-gradient(180deg, #ffffff 0%, #fafbff 100%);
  border-radius: 12px;
  padding: 16px 16px 20px;
  box-shadow: 0 4px 20px rgba(9, 30, 66, 0.06);
}

/* 底部按钮 */
.form-actions { margin-top: 24px; display: flex; gap: 28px; justify-content: center; }
.btn-repull {
  width: 140px; height: 40px; background: #fff; color: #1890ff;
  border: 1px solid #d9d9d9; border-radius: 8px; font-size: 16px;
}
.btn-save {
  width: 220px; height: 40px; background: #1890ff; color: #fff;
  border: 1px solid #1890ff; border-radius: 8px; font-size: 16px;
}
.btn-import {
  width: 140px; height: 40px; background: #fff; color: #1890ff;
  border: 1px dashed #1890ff; border-radius: 8px; font-size: 16px;
}
.mt-3 { margin-top: 12px; }
.import-row :deep(.el-upload-dragger) { width: 100%; }
button:hover { opacity: .9; }
</style>
