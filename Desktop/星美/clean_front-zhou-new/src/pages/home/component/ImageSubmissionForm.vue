<template>
  <div class="image-submission-container">
    <div class="path-selection-section" v-if="withPath">
      <el-cascader
        v-model="selectedSubmitPath"
        :options="cascaderOpts"
        :props="{ ...(cascaderProps || {}), multiple: false }"
        clearable
        filterable
        :show-all-levels="false"
        placeholder="点击选择场景 / 设施 / 材质 / 朝向（仅支持单选）"
        style="width:420px"
      />
    </div>

    <div class="upload-section">
      <el-upload
        ref="uploadRef"
        class="upload-demo"
        action=""
        :http-request="handleUpload"
        :before-upload="beforeUpload"
        :on-success="onUploadSuccess"
        :on-error="onUploadError"
        :show-file-list="true"
        v-model:file-list="fileList"
        :limit="1"
        :on-exceed="onExceed"
        :on-change="onChange"
        :on-remove="onRemove"
        :auto-upload="false"
        accept="image/*"
      >
        <el-button type="primary" :loading="uploading">
          <el-icon><Upload /></el-icon>
          选择图片
        </el-button>
        <template #tip>
          <div class="el-upload__tip">支持 JPG、PNG、WEBP 等常见图片格式</div>
        </template>
      </el-upload>

      <el-button 
        type="success" 
        @click="submitSelectedImage"
        :disabled="!fileList.length || submitting || uploading || (withPath && !selectedSubmitPath.length)"
        class="submit-btn"
      >
        <el-icon v-if="!submitting"><Check /></el-icon>
        <el-icon v-else><Loading /></el-icon>
        {{ submitting ? '提交中...' : '提交图片' }}
      </el-button>
    </div>

    <div v-if="withPath" class="selected-area">
      <div class="selected-title">已选路径：</div>
      <template v-if="selectedSubmitPath.length">
        <div class="chips-wrap">
          <el-tag
            class="chip path-chip"
            :style="getChipStyle(selectedSubmitPath, 0)"
            size="small"
            closable
            @close="selectedSubmitPath = []"
          >
            <i class="dot" :style="{background:getChipStyle(selectedSubmitPath, 0)['--chip-deco']}" />
            {{ formatPath(selectedSubmitPath) }}
          </el-tag>
        </div>
      </template>
      <template v-else>
        <div class="selected-empty">请先选择一个路径</div>
      </template>
    </div>

    <div v-if="previewImage" class="preview-section">
      <div class="preview-title">图片预览</div>
      <div class="preview-container">
        <img :src="previewImage" alt="预览图片" class="preview-image" />
      </div>
    </div>

    <div class="form-section">
      <el-form ref="formRef" :model="formData" label-width="100px">
        <el-form-item v-if="withImageName" label="图片命名" prop="imageName">
          <el-input 
            v-model="formData.imageName" 
            placeholder="请输入图片名称（可选，默认使用原文件名）" 
          />
        </el-form-item>
        
        <el-form-item label="备注信息" prop="remark">
          <el-input 
            v-model="formData.remark" 
            placeholder="请输入备注信息（可选）" 
            type="textarea" 
            :rows="2" 
          />
        </el-form-item>

        <el-form-item label="图片分数" prop="score">
          <el-slider
            v-model="formData.score"
            :min="0"
            :max="100"
            :step="1"
            show-input
            style="width: 300px;"
          />
        </el-form-item>

        <el-form-item label="图片标签" prop="tags">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            allow-create
            collapse-tags
            collapse-tags-tooltip
            placeholder="输入或选择标签"
            style="width: 100%;"
          >
            <el-option
              v-for="tag in tagOptions"
              :key="tag.id"
              :label="tag.tag_name"
              :value="tag.tag_name"
            />
          </el-select>
        </el-form-item>
        
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Check, Loading, Plus, Delete } from '@element-plus/icons-vue'
import { uploadAndSubmitImage } from '@/services/submissionService.js'

const props = defineProps({
  cascaderOpts: { type: Array, default: () => [] },
  cascaderProps: { type: Object, default: () => ({}) },
  withPath: { type: Boolean, default: true },
  withImageName: { type: Boolean, default: true },
  tagOptions: { type: Array, default: () => [] },
})
const emit = defineEmits(['submitted'])

const uploadRef = ref(null)
const fileList = ref([])
const previewImage = ref('')
const uploading = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const formData = reactive({
  imageName: '',
  remark: '',
  score: 80,
  tags: [],
})

const selectedSubmitPath = ref([])

const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isImage) { ElMessage.error('只能上传图片文件!'); return false }
  if (!isLt10M) { ElMessage.error('上传图片大小不能超过 10MB!'); return false }
  const reader = new FileReader()
  reader.onload = (e) => { previewImage.value = e.target.result }
  reader.readAsDataURL(file)
  return true
}

const handleUpload = async (options) => {
  uploading.value = true
  try {
    setTimeout(() => { options.onSuccess({}) }, 400)
  } catch (error) {
    options.onError(error)
  } finally {
    uploading.value = false
  }
}

const onUploadSuccess = () => { ElMessage.success('图片上传成功') }
const onUploadError = (error) => { ElMessage.error('图片上传失败：' + (error?.message || '未知错误')) }

// 统一文件变更与移除处理，保证按钮禁用条件与预览联动
// 直接使用用户输入的名称，不再进行清理处理

const onChange = (file, fl) => {
    // 取最新的文件列表（Element Plus 会传入标准化的列表）
    fileList.value = fl.slice(0, 1)
    // 切换文件时刷新预览
    const raw = file?.raw || fileList.value[0]?.raw
    if (raw) {
      const reader = new FileReader()
      reader.onload = (e) => { previewImage.value = e.target.result }
      reader.readAsDataURL(raw)
    }
  }
const onRemove = () => {
  if (!fileList.value.length) {
    previewImage.value = ''
  }
}
const onExceed = (files) => {
  // 超出限制时，替换为新文件
  fileList.value = []
  const file = files[0]
  // 手动添加到 upload 组件
  uploadRef.value?.clearFiles?.()
  uploadRef.value?.handleStart?.(file)
  // 触发一次变更以更新预览
  onChange({ raw: file }, [{ raw: file }])
}


const submitSelectedImage = async () => {
  if (!fileList.value.length) { ElMessage.warning('请先选择图片'); return }
  if (props.withPath && !selectedSubmitPath.value.length) { ElMessage.warning('请先选择提交路径'); return }
  submitting.value = true
  let submissionResult = null
  
  try {
    const file = fileList.value[0].raw
    const userInputName = formData.imageName.trim()
    
    // 构建符合用户提供JSON格式的元数据
    const metadata = {
      task_context: selectedSubmitPath.value,
      remark: formData.remark,
      annotations: [],
      custom_name: userInputName, // 直接使用用户输入的名称作为custom_name
      score: Number(formData.score),
      tags: Array.isArray(formData.tags) ? formData.tags.map(s => String(s).trim()).filter(Boolean) : [],
      cleanupUrl: false,
      client_id: globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    }
    
    console.log('[提交图片] 使用custom_name字段提交:', metadata.custom_name)
    submissionResult = await uploadAndSubmitImage(file, metadata)
    
    // 处理提交结果
    if (submissionResult && submissionResult.data && Array.isArray(submissionResult.data) && submissionResult.data.length > 0) {
      const submissionId = submissionResult.data[0].id
      const fileData = submissionResult.data[0]
      console.log('[提交成功] 得到提交ID:', submissionId)
      
      // 详细记录fileData的完整结构，特别是custom_name字段
      console.log('[提交数据] fileData完整内容:', JSON.stringify(fileData, null, 2))
      console.log('[提交数据] fileData中各关键字段检查:', {
        hasId: fileData.id !== undefined,
        hasCustomName: fileData.custom_name !== undefined,
        customNameType: typeof fileData.custom_name,
        customNameValue: fileData.custom_name,
        hasFileName: fileData.file_name !== undefined,
        fileNameValue: fileData.file_name,
        hasSubmissionId: fileData.submission_id !== undefined,
        submissionIdValue: fileData.submission_id
      })
      
      // 优先使用服务器返回的fileData中的custom_name（如果存在且不为空），否则使用metadata中的值
      // 增强检查，确保即使fileData.custom_name不存在也能正确处理
      console.log('[提交数据] fileData对象结构检查:', {
        hasCustomName: 'custom_name' in fileData,
        customNameDefined: fileData.custom_name !== undefined,
        customNameNull: fileData.custom_name === null,
        customNameType: typeof fileData.custom_name,
        customNameValue: fileData.custom_name
      })
      
      const serverCustomName = ('custom_name' in fileData && fileData.custom_name !== undefined && fileData.custom_name !== null) 
        ? String(fileData.custom_name).trim() 
        : ''
      const metadataCustomName = metadata.custom_name ? String(metadata.custom_name).trim() : ''
      
      console.log('[提交数据] 服务器返回的custom_name:', serverCustomName, '(长度:', serverCustomName.length, ')')
      console.log('[提交数据] metadata中的custom_name:', metadataCustomName, '(长度:', metadataCustomName.length, ')')
      
      // 只有当服务器返回的custom_name非空时才使用它，否则使用metadata中的值
      const finalCustomName = serverCustomName || metadataCustomName;
      console.log('[提交信息] 最终使用的custom_name:', finalCustomName, '(长度:', finalCustomName.length, ')')
      console.log('[提交信息] 是否使用服务器返回值:', !!serverCustomName)
      console.log('[提交信息] 是否使用metadata值:', !serverCustomName && !!metadataCustomName)
      
      // 通知数据准备，仅在finalCustomName非空时添加该字段
      const notificationData = {
        submissionId: submissionId,
        fileDataId: fileData.id,
        fileDataSubmissionId: fileData.submission_id || fileData.id,
        hasSubmissionIdField: !!fileData.submission_id
      }
      
      // 只有当finalCustomName非空时才添加到通知数据中，避免传递空字符串
      if (finalCustomName && finalCustomName.length > 0) {
        notificationData.customName = finalCustomName
        console.log('[通知机制] 发送带有自定义名称的通知:', finalCustomName)
      } else {
        console.log('[通知机制] 发送不含自定义名称的通知（值为空或未提供）')
      }
      
      // 添加一个通知机制，让AssetDownload组件能够感知到新提交的图片
      if (window.__notifyNewSubmission) {
        console.log('[通知机制] 发送新提交通知:', notificationData)
        // 增强通知机制：确保fileData始终包含custom_name字段，无论其是否为空
        const enhancedFileData = { ...fileData }
        // 直接添加custom_name字段，确保它总是存在
        enhancedFileData.custom_name = finalCustomName
        console.log('[通知机制] 增强后的fileData.custom_name:', enhancedFileData.custom_name)
        
        // 调用通知函数，确保第三个参数fileData中始终包含custom_name字段
        window.__notifyNewSubmission(submissionId, finalCustomName, enhancedFileData)
      } else {
        console.error('[通知机制] 错误：window.__notifyNewSubmission未定义')
      }
    }
    
    ElMessage.success('图片提交成功' + (userInputName ? '，使用自定义名称' : ''))
    resetForm()
    emit('submitted', submissionResult)
  } catch (error) {
    console.error('提交图片失败:', error)
    ElMessage.error('图片提交失败：' + (error.message || '未知错误'))
    
    // 如果图片提交成功但后续处理失败，仍然告诉用户提交成功
    if (submissionResult) {
      ElMessage.info('图片已成功上传')
      resetForm()
      emit('submitted', submissionResult)
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  formData.imageName = ''
  formData.remark = ''
  formData.score = 80
  formData.tags = []
  fileList.value = []
  previewImage.value = ''
  if (formRef.value) formRef.value.resetFields()
  if (props.withPath) selectedSubmitPath.value = []
}

// 展示辅助：配色与路径格式
const formatPath = (p) => (Array.isArray(p) ? p.join(' / ') : '')
const hslFromStr = (s, idx=0) => {
  const str = Array.isArray(s) ? s.join('/') : String(s||'')
  let h = 0
  for (let i=0;i<str.length;i++) h = (h*31 + str.charCodeAt(i)) >>> 0
  h = (h + idx*73) % 360
  return {h, s: 42, l: 97}
}
const getChipStyle = (p, idx=0) => {
  const {h,s,l} = hslFromStr(p, idx)
  return {
    '--chip-bg': `hsl(${h} ${s}% ${l}%)`,
    '--chip-deco': `hsl(${h} ${Math.max(30,s-8)}% ${Math.max(82,l-12)}%)`,
    '--chip-bd': `hsl(${h} ${Math.max(26,s-18)}% ${Math.max(70,l-22)}%)`,
    '--chip-fg': '#374151',
    background: `linear-gradient(180deg, var(--chip-bg), hsl(${h} ${s}% ${Math.max(94,l-3)}%))`,
    borderColor: 'var(--chip-bd)',
    color: 'var(--chip-fg)'
  }
}
</script>

<style scoped>
.image-submission-container { padding: 32px; background-color: #fff; border-radius: 4px; }
.path-selection-section { margin-bottom: 24px; }
.upload-section { display:flex; gap:12px; align-items:center; margin-bottom:24px; padding:20px; background:#f9fafb; border-radius:8px; border:2px dashed #e5e7eb; }
.submit-btn { margin-left:auto; }
.selected-area { margin-top: 0; background:#f7f9fc; border:2px dashed #c6d4e6; border-radius:12px; padding:12px 14px; min-height: 68px; box-sizing:border-box; }
.selected-title { font-size:13px; color:#6b778c; margin-bottom:6px; }
.selected-empty { font-size: 13px; color:#9aa4b2; padding: 6px 2px 2px; }
.chips-wrap { display:flex; flex-wrap:wrap; gap:8px; }
.chip.path-chip{ border-radius:999px; border:1px solid var(--chip-bd); padding:4px 10px; display:inline-flex; align-items:center; gap:6px; }
.chip .dot{ width:8px; height:8px; border-radius:999px; display:inline-block; }
.preview-section { margin-bottom:24px; }
.preview-title { font-size:14px; font-weight:600; color:#374151; margin-bottom:12px; margin-top:12px;}
.preview-container { display:flex; justify-content:center; align-items:center; padding:16px; background:#fff; border:1px solid #e5e7eb; border-radius:8px; min-height:200px; }
.preview-image { max-width:100%; max-height:400px; object-fit:contain; border-radius:4px; }
.form-section { margin-top:24px; }

@media (max-width: 768px) {
  .image-submission-container { padding: 16px; }
  .upload-section { flex-direction: column; align-items: stretch; }
  .submit-btn { margin-left: 0; width: 100%; }
}
</style>


