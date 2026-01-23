<template>
  <div class="asset-download">
    <!-- 顶部分选栏 -->
    <el-tabs v-model="activeTab" type="card" class="dl-tabs pill-tabs">
      <el-tab-pane label="按场景下载" name="scene" />
      <el-tab-pane label="按标签下载" name="tag" />
      <el-tab-pane label="按时间下载" name="time" />
      <el-tab-pane label="图片提交" name="submit" />
    </el-tabs>

    <!-- ============ 按场景下载 ============ -->
    <div v-if="activeTab==='scene'" class="pane-body">
      <el-space direction="vertical" alignment="flex-start" :size="16">
        <!-- 级联控件（仅用于筛选） -->
        <el-cascader
          v-model="selected"
          :options="cascaderOpts"
          :props="cascaderProps"
          clearable
          filterable
          :collapse-tags="true"
          :max-collapse-tags="1"
          collapse-tags-tooltip
          :show-all-levels="false"
          placeholder="点击选择场景 / 设施 / 材质 / 朝向（支持多选）"
          style="width:420px"
        />

        <!-- 搜索框：支持 文件名 / submission_id 模式 -->
        <div class="search-line">
          <el-input
            v-model="kw"
            :placeholder="searchPlaceholder"
            clearable
            style="width:260px"
            @keyup.enter.native="triggerSearch"
          >
            <template #prefix><el-icon><i class="el-icon-search" /></el-icon></template>
          </el-input>

          <el-select v-model="searchMode" size="small" style="width:120px;margin-left:8px">
            <el-option label="按名称" value="name" />
            <el-option label="按编号" value="id" />
          </el-select>

          <el-checkbox
            v-model="searchWithinPath"
            :disabled="!selected.length"
            style="margin-left:10px"
          >
            仅在已选路径内搜索
          </el-checkbox>
        </div>

        <!-- 已选路径展示 -->
        <div class="selected-area">
          <div class="selected-title">已选路径：</div>
          <template v-if="selected.length">
            <div class="chips-wrap">
              <el-tag
                v-for="(p, idx) in selected"
                :key="pathKey(p)"
                class="chip path-chip"
                :style="getChipStyle(p, idx)"
                size="small"
                closable
                @close="removePath(idx)"
              >
                <i class="dot" :style="{background:getChipStyle(p,idx)['--chip-deco']}"></i>
                {{ formatPath(p) }}
              </el-tag>
            </div>
          </template>
          <template v-else>
            <div class="selected-empty">暂未选择任何路径</div>
          </template>
        </div>

        <!-- 动作区 -->
        <div class="download-actions">
          <el-button type="danger" class="btn-clear btn-md" :disabled="!selected.length" @click="reset">清空已选</el-button>
          <el-button type="primary" class="btn-download btn-md" @click="downloadAll">确认下载 ({{ filtered.length }})</el-button>
          <el-button type="info" plain class="btn-secondary btn-md" @click="load">重新拉取</el-button>
          <el-button type="success" plain class="btn-secondary btn-md" @click="downloadBatch" :disabled="!filtered.length || downloadingBatch">批量下载 ZIP</el-button>
        </div>

        <!-- 进度条 -->
        <div v-if="showProgress" class="download-progress-container">
          <el-progress :percentage="downloadProgress" :status="downloadingBatch ? 'normal' : 'success'" :text-inside="true" stroke-width="20" />
          <div class="progress-text">
            正在下载 {{ filtered.length }} 个文件 ({{ downloadProgress }}%)
          </div>
        </div>

        <!-- 结果网格（右侧处理面板） -->
        <template v-if="filtered.length">
          <el-row :gutter="24" class="grid-wrap">
            <el-col v-for="f in pagedFiltered" :key="f.id" :span="12" class="grid-col">
              <el-card class="asset-card biz-look" shadow="hover">
                <div class="card-main">
                  <!-- 左：缩略图（固定手机常见比例 3:4，占位也保持比例） -->
                  <div class="thumb-wrap phone-aspect">
                    <img :src="f.file_url" @error="handleImageError($event, f.file_url)" />
                    <div class="card-actions">
                      <el-tooltip content="标注（弹窗）" placement="top">
                        <div class="icon action" @click.stop="openRate(f)">
                          <el-icon><EditPen /></el-icon>
                        </div>
                      </el-tooltip>
                      <el-tooltip content="重命名" placement="top">
                        <div class="icon action" @click.stop="openRenameDialog(f)">
                          <el-icon><Edit /></el-icon>
                        </div>
                      </el-tooltip>
                      <el-tooltip content="下载" placement="top">
                        <div class="icon action" @click.stop="downloadOne(f)">
                          <el-icon><Download /></el-icon>
                        </div>
                      </el-tooltip>
                      <!-- 新增：删除 -->
                      <el-tooltip content="删除" placement="top">
                        <div class="icon action danger" :class="{ disabled: deletingId===f.id }" @click.stop="deletingId!==f.id && deleteOne(f)">
                          <el-icon><DeleteIcon /></el-icon>
                        </div>
                      </el-tooltip>
                    </div>
                  </div>

                  <!-- 右：处理面板（分数 + 图片级标签 + 当前标注列表） -->
                  <div class="ops-wrap">
                    <!-- 显示自定义名称或完整的文件名（包含扩展名） -->
                    <div class="ops-title">{{ getDisplayName(f) }}</div>

                    <!-- 分数（图片级） -->
                    <div class="ops-row">
                      <div class="ops-label">分数</div>
                      <div class="ops-field">
                        <el-slider
                          v-model="scoreById[f.id]"
                          :min="0" :max="100" :step="1"
                          @change="onQuickSliderChange(f)"
                        />
                        <el-input-number
                          v-model="scoreById[f.id]"
                          :min="0" :max="100" :step="1"
                          :controls="false" size="small" class="num"
                          @change="onQuickSliderChange(f)"
                        />
                      </div>
                    </div>

                    <!-- 图片标签（快捷） -->
                    <div class="ops-row">
                      <div class="ops-label">图片标签</div>
                      <div class="ops-field">
                        <el-select
                          v-model="quickTagsById[f.id]"
                          multiple filterable allow-create
                          collapse-tags collapse-tags-tooltip
                          default-first-option
                          placeholder="输入或选择标签"
                          style="flex:1"
                        >
                          <el-option v-for="t in tagOptions" :key="t.id" :label="t.tag_name" :value="t.tag_name" />
                        </el-select>
                      </div>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="ops-buttons">
                      <el-button size="small" @click.stop="openRate(f)">标注</el-button>
                      <el-button
                        size="small"
                        type="primary"
                        :loading="quickSavingId===f.id"
                        @click.stop="submitQuickScore(f)"
                      >提交</el-button>

                      <el-button size="small" plain @click.stop="downloadOne(f)">下载</el-button>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <div class="grid-pagination">
            <span class="total-cn">共 {{ filtered.length }} 项</span>
            <el-pagination
              background small
              layout="prev, pager, next, jumper"
              prev-text="上一页"
              next-text="下一页"
              v-model:current-page="gridPage"
              :page-size="pageSize"
              :total="filtered.length"
            />
          </div>
        </template>
        <el-empty v-else description="暂无匹配的素材" :image-size="60" class="empty-block" />
      </el-space>
    </div>

    <!-- ============ 按标签下载 ============ -->
    <div v-else-if="activeTab === 'tag'" class="pane-body">
      <div class="tag-line">
        <el-select v-model="selectedTag" placeholder="选择标签批量下载" filterable clearable style="width:220px">
          <el-option v-for="t in tagOptions" :key="t.id" :label="t.tag_name" :value="t.tag_name" />
        </el-select>
        <el-button type="success" :loading="loadingTag" :disabled="!selectedTag" style="margin-left:12px" @click="downloadTagZip" size="small">标签 ZIP 下载</el-button>
        <el-button type="info" plain style="margin-left:12px" @click="handleRefreshTags" size="small">刷新标签</el-button>
      </div>
    </div>
    
    <!-- ============ 按时间下载 ============ -->
    <div v-else-if="activeTab === 'time'" class="pane-body">
      <div class="time-line">

        <!-- 级联控件（用于路径筛选） -->
        <el-cascader
          v-model="timeSelectedPath"
          :options="cascaderOpts"
          :props="cascaderProps"
          clearable
          filterable
          :collapse-tags="true"
          :max-collapse-tags="1"
          collapse-tags-tooltip
          :show-all-levels="false"
          placeholder="点击选择场景 / 设施 / 材质 / 朝向（支持多选）"
          style="width:420px; margin-bottom: 16px;"
        />
        <!-- 搜索框：支持 文件名 / submission_id 模式 -->
        <div class="search-line">
          <el-input
            v-model="timeKw"
            :placeholder="searchPlaceholder"
            clearable
            style="width:260px"
            @keyup.enter.native="triggerTimeSearch"
          >
            <template #prefix><el-icon><i class="el-icon-search" /></el-icon></template>
          </el-input>

          <el-select v-model="timeSearchMode" size="small" style="width:120px;margin-left:8px">
            <el-option label="按名称" value="name" />
            <el-option label="按编号" value="id" />
          </el-select>

          <el-checkbox
            v-model="timeSearchWithinPath"
            :disabled="!timeSelectedPath.length"
            style="margin-left:10px"
          >
            仅在已选路径内搜索
          </el-checkbox>
        </div>

        <!-- 日期选择器 -->
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 400px; margin-bottom: 16px;"
        />

        <!-- 已选路径展示 -->
        <div class="selected-area">
          <div class="selected-title">已选路径：</div>
          <template v-if="timeSelectedPath.length">
            <div class="chips-wrap">
              <el-tag
                v-for="(p, idx) in timeSelectedPath"
                :key="pathKey(p)"
                class="chip path-chip"
                :style="getChipStyle(p, idx)"
                size="small"
                closable
                @close="removeTimePath(idx)"
              >
                <i class="dot" :style="{background:getChipStyle(p,idx)['--chip-deco']}"></i>
                {{ formatPath(p) }}
              </el-tag>
            </div>
          </template>
          <template v-else>
            <div class="selected-empty">暂未选择任何路径</div>
          </template>
        </div>
        <!-- 动作区 -->
        <div class="download-actions">
          <el-button type="danger" class="btn-clear btn-md" :disabled="!timeSelectedPath.length" @click="resetTimePath" size="small">清空已选</el-button>
          <el-button type="primary" class="btn-download btn-md" :loading="loadingTime" :disabled="!dateRange || dateRange.length < 2" @click="downloadByDate" size="small">按时间下载</el-button>
          <el-button type="success" plain class="btn-secondary btn-md" @click="downloadBatchByTime" :disabled="!timeFilteredFiles.length || timeDownloadingBatch" size="small">批量下载 ZIP ({{ timeFilteredFiles.length }})</el-button>
        </div>
        
        <!-- 进度条 -->
        <div v-if="timeDownloadingBatch" class="download-progress-container">
          <el-progress :percentage="timeDownloadProgress" :status="timeDownloadingBatch ? 'normal' : 'success'" :text-inside="true" stroke-width="20" />
          <div class="progress-text">
            正在下载 {{ timeFilteredFiles.length }} 个文件 ({{ timeDownloadProgress }}%)
          </div>
        </div>
        <!-- 结果网格 -->
        <div v-if="timeFilteredFiles.length > 0" class="asset-grid">
          <el-row :gutter="24" class="grid-wrap">
            <el-col v-for="f in timePagedFiles" :key="f.id" :span="12" class="grid-col">
              <el-card class="asset-card biz-look" shadow="hover">
                <div class="card-main">
                  <!-- 左：缩略图（固定手机常见比例 3:4，占位也保持比例） -->
                  <div class="thumb-wrap phone-aspect">
                    <img :src="f.file_url" @error="handleImageError($event, f.file_url)" />
                    <div class="card-actions">
                      <el-tooltip content="标注（弹窗）" placement="top">
                        <div class="icon action" @click.stop="openRate(f)">
                          <el-icon><EditPen /></el-icon>
                        </div>
                      </el-tooltip>
                      <el-tooltip content="重命名" placement="top">
                        <div class="icon action" @click.stop="openRenameDialog(f)">
                          <el-icon><Edit /></el-icon>
                        </div>
                      </el-tooltip>
                      <el-tooltip content="下载" placement="top">
                        <div class="icon action" @click.stop="downloadOne(f)">
                          <el-icon><Download /></el-icon>
                        </div>
                      </el-tooltip>
                      <!-- 新增：删除 -->
                      <el-tooltip content="删除" placement="top">
                        <div class="icon action danger" :class="{ disabled: deletingId===f.id }" @click.stop="deletingId!==f.id && deleteOne(f)">
                          <el-icon><DeleteIcon /></el-icon>
                        </div>
                      </el-tooltip>
                    </div>
                  </div>

                  <!-- 右：处理面板（分数 + 图片级标签 + 当前标注列表） -->
                  <div class="ops-wrap">
                    <!-- 显示自定义名称或完整的文件名（包含扩展名） -->
                    <div class="ops-title">{{ getDisplayName(f) }}</div>

                    <!-- 分数（图片级） -->
                    <div class="ops-row">
                      <div class="ops-label">分数</div>
                      <div class="ops-field">
                        <el-slider
                          v-model="scoreById[f.id]"
                          :min="0" :max="100" :step="1"
                          @change="onQuickSliderChange(f)"
                        />
                        <el-input-number
                          v-model="scoreById[f.id]"
                          :min="0" :max="100" :step="1"
                          :controls="false" size="small" class="num"
                          @change="onQuickSliderChange(f)"
                        />
                      </div>
                    </div>

                    <!-- 图片标签（快捷） -->
                    <div class="ops-row">
                      <div class="ops-label">图片标签</div>
                      <div class="ops-field">
                        <el-select
                          v-model="quickTagsById[f.id]"
                          multiple filterable allow-create
                          collapse-tags collapse-tags-tooltip
                          default-first-option
                          placeholder="输入或选择标签"
                          style="flex:1"
                          @change="onQuickTagsChange(f)"
                        >
                          <el-option v-for="t in tagOptions" :key="t.id" :label="t.tag_name" :value="t.tag_name" />
                        </el-select>
                      </div>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="ops-buttons">
                      <el-button size="small" @click.stop="openRate(f)">标注</el-button>
                      <el-button
                        size="small"
                        type="primary"
                        :loading="quickSavingId===f.id"
                        @click.stop="submitQuickScore(f)"
                      >提交</el-button>

                      <el-button size="small" plain @click.stop="downloadOne(f)">下载</el-button>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <!-- 分页 -->
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="timeGridPage"
              :page-size="timePageSize"
              :total="timeFilteredFiles.length"
              layout="total, prev, pager, next"
              :pager-count="7"
            />
          </div>
        </div>
        <el-empty v-else description="暂无匹配的素材" :image-size="60" class="empty-block" />
      </div>
    </div>
    
    <!-- ============ 图片提交 ============ -->
    <div v-else class="pane-body">
      <ImageSubmissionForm
        :cascader-opts="cascaderOpts"
        :cascader-props="cascaderProps"
        :tag-options="tagOptions"
        with-path
        with-image-name
        @submitted="onSubmittedFromChild"
      />
    </div>

    <!-- 图片预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="图片预览"
      width="80%"
      top="20px"
      :destroy-on-close="true"
    >
      <el-image
        v-if="previewImageUrl"
        :src="previewImageUrl"
        fit="contain"
        :zoom-rate="1.2"
        :min-scale="0.5"
        :max-scale="3"
        preview-teleported
      >
        <template #error>
          <div class="image-error">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>图片加载失败</span>
          </div>
        </template>
      </el-image>
    </el-dialog>

    <!-- ============ 全局对话框（所有标签页共享） ============ -->
    <!-- 标注弹窗（与图片绑定） -->
    <el-dialog v-model="rateVisible" title="评分 / 标注" width="1000px" :close-on-click-modal="false">
      <div class="rate-layout">
        <!-- 左：绘制区 -->
        <div
          class="draw-stage"
          ref="stageRef"
          @mousedown="onStageDown"
          @mousemove="onStageMove"
          @mouseup="onStageUp"
          @mouseleave="onStageUp"
        >
          <!-- 可缩放&可平移的画布 -->
          <div class="canvas-wrap" :style="canvasTransform" ref="canvasRef">
            <img :src="rateTarget ? rateTarget.file_url : ''" ref="stageImg" @load="onImgLoad" @error="handleImageError($event, rateTarget?.file_url)" />

            <!-- 历史框 -->
            <template v-for="(hb, i) in historyBoxes" :key="'h'+i">
              <div class="draw-box history" :class="{active: i===activeHistoryIdx}" :style="toStageStyle(hb.bbox)">
                <el-tooltip content="历史框" placement="top">
                  <span class="box-badge"><span class="tag">历史</span></span>
                </el-tooltip>
              </div>
            </template>

            <!-- 新建框 -->
            <template v-for="(nb, i) in newBoxes" :key="'n'+i">
              <div class="draw-box new" :style="toStageStyle(nb.bbox)">
                <el-tooltip :content="nb.remark ? ('备注：' + nb.remark) : '新建框'" placement="top">
                  <span class="box-badge"><span class="tag">新建</span></span>
                </el-tooltip>
              </div>
            </template>

            <!-- 绘制中的框（临时） -->
            <div v-if="drawingBox" class="draw-box drawing" :style="toStageStyle(drawingBox)">
              <el-tooltip content="绘制中" placement="top">
                <span class="box-badge"><span class="tag">绘制</span></span>
              </el-tooltip>
            </div>
          </div>
        </div>

        <!-- 右：属性面板 -->
        <div class="draw-sidebar">
          <!-- 图片信息 -->
          <div class="section-title">
            <span class="bar"></span>
            <span class="text">图片信息</span>
          </div>
          <div class="anno-row">
            <div class="field">
              <label>文件名：</label>
              <span class="value ellipsis">{{ rateTarget?.custom_name || rateTarget?.file_name }}</span>
            </div>
            <div class="field">
              <label>尺寸：</label>
              <span class="value">{{ imgNaturalWidth }} × {{ imgNaturalHeight }}</span>
            </div>
            <div class="field">
              <label>路径：</label>
              <span class="value ellipsis">{{ rateTarget?.path || '-' }}</span>
            </div>
          </div>

          <!-- 标注工具条 -->
          <div class="section-title">
            <span class="bar"></span>
            <span class="text">标注工具</span>
          </div>
          <div class="anno-row">
            <el-radio-group v-model="drawMode" @change="onDrawModeChange" size="small">
              <el-radio-button label="select">选择</el-radio-button>
              <el-radio-button label="draw">绘制</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 历史标注 / 新建标注 -->
          <div class="section-title">
            <span class="bar"></span>
            <span class="text">标注信息</span>
          </div>
          <div class="anno-tabs">
            <el-tabs v-model="annoActiveTab" type="card" size="small" @tab-change="onAnnoTabChange">
              <el-tab-pane label="历史标注" name="history">
                <div class="anno-list">
                  <div v-if="historyBoxes.length">
                    <div
                      v-for="(hb, i) in historyBoxes"
                      :key="'hb-'+i"
                      class="anno-item"
                      :class="{active: i===activeHistoryIdx}"
                      @click="selectHistoryBox(i)"
                    >
                      <div class="anno-type">
                        <span class="anno-tag" :style="{backgroundColor: hb.color}">{{ hb.class_name }}</span>
                        <el-tooltip :content="hb.score ? ('评分：' + hb.score) : '未评分'" placement="top">
                          <el-rate
                            v-model="hb.score"
                            disabled
                            text-color="#909399"
                            show-score
                            score-template="{value}"
                            style="margin-left:6px"
                          />
                        </el-tooltip>
                      </div>
                      <div class="anno-bbox">
                        <span class="box-pos">{{ Math.round(hb.bbox.x1) }}, {{ Math.round(hb.bbox.y1) }}</span>
                        <span class="box-size">({{ Math.round(hb.bbox.x2 - hb.bbox.x1) }}×{{ Math.round(hb.bbox.y2 - hb.bbox.y1) }})</span>
                      </div>
                      <div class="anno-remark ellipsis">
                        {{ hb.remark || '无备注' }}
                      </div>
                    </div>
                  </div>
                  <div v-else class="empty-anno">暂无历史标注</div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="新建标注" name="new">
                <div class="anno-list">
                  <div v-if="newBoxes.length">
                    <div
                      v-for="(nb, i) in newBoxes"
                      :key="'nb-'+i"
                      class="anno-item"
                      :class="{active: i===activeNewIdx}"
                      @click="selectNewBox(i)"
                    >
                      <div class="anno-type">
                        <el-select
                          v-model="nb.class_name"
                          placeholder="选择类别"
                          size="small"
                          style="width:140px"
                          @change="onClassNameChange"
                        >
                          <el-option
                            v-for="c in labelClasses"
                            :key="c.label"
                            :label="c.label"
                            :value="c.label"
                          />
                        </el-select>
                        <el-rate
                          v-model="nb.score"
                          :colors="['#F7BA2A', '#F7BA2A', '#F7BA2A']"
                          text-color="#909399"
                          show-score
                          score-template="{value}"
                          style="margin-left:6px"
                          @change="onScoreChange"
                        />
                      </div>
                      <div class="anno-bbox">
                        <span class="box-pos">{{ Math.round(nb.bbox.x1) }}, {{ Math.round(nb.bbox.y1) }}</span>
                        <span class="box-size">({{ Math.round(nb.bbox.x2 - nb.bbox.x1) }}×{{ Math.round(nb.bbox.y2 - nb.bbox.y1) }})</span>
                      </div>
                      <div class="anno-remark">
                        <el-input
                          v-model="nb.remark"
                          type="textarea"
                          placeholder="添加备注（可选）"
                          size="small"
                          :rows="2"
                          @input="onRemarkChange"
                        />
                      </div>
                    </div>
                  </div>
                  <div v-else class="empty-anno">暂无新建标注</div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>

          <!-- 保存 / 清除当前框 -->
          <div class="section-title">
            <span class="bar"></span>
            <span class="text">当前框操作</span>
          </div>
          <div class="anno-row">
            <div class="field">
              <el-button
                size="small"
                type="success"
                :disabled="!canSaveBox"
                @click="saveCurrentBox"
              >保存框</el-button>
              <el-button
                size="small"
                :disabled="!hasSelectedBox"
                @click="deleteCurrentBox"
              >删除框</el-button>
              <el-button
                size="small"
                :disabled="drawMode==='select' || !drawingBox"
                @click="cancelDrawing"
              >取消绘制</el-button>
            </div>
          </div>

          <!-- 查看 / 缩放（放在右侧栏） -->
          <div class="section-title">
            <span class="bar"></span>
            <span class="text">查看 / 缩放</span>
          </div>
          <div class="anno-row">
            <div class="field zoom-side">
              <el-button size="small" @click="fitCanvas">适配</el-button>
              <el-button size="small" @click="zoomReset">100%</el-button>
              <el-button size="small" @click="zoomOut" :disabled="zoom<=zoomMin">-</el-button>
              <span class="zoom-text">{{ Math.round(zoom*100) }}%</span>
              <el-button size="small" @click="zoomIn" :disabled="zoom>=zoomMax">+</el-button>
              <span class="zoom-hint">按住空格可拖动；Ctrl+滚轮缩放</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="rateVisible=false">取消</el-button>
        <!-- 新增：删除按钮（弹窗内） -->
        <el-button
          type="danger"
          plain
          :loading="deletingId===rateTarget?.id"
          :disabled="!rateTarget"
          @click="deleteFromDialog"
        >删除</el-button>
        <el-button type="primary" :loading="rateSubmitting" @click="submitRate">提交</el-button>
      </template>
    </el-dialog>

    <!-- 重命名对话框 -->
    <el-dialog v-model="renameDialogVisible" title="重命名图片备注" width="400px" :close-on-click-modal="false">
      <el-input
        v-model="newCustomName"
        placeholder="请输入新的备注名"
        maxlength="100"
        show-word-limit
        clearable
      />
      <template #footer>
        <el-button @click="renameDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="confirmRename">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox, ElProgress } from 'element-plus'
import { Download, EditPen, Delete as DeleteIcon, Upload, Check, Loading, Plus, Delete, Edit } from '@element-plus/icons-vue'
import { uploadAndSubmitImage, renameSubmissionImage } from '@/services/submissionService.js'
import ImageSubmissionForm from './component/ImageSubmissionForm.vue'

/* 索引：id -> file / ctx */
let idToFile = new Map()
let idToCtx  = new Map()

/* API：全部走代理，避免 CORS */
const API_BASE = '/api/v1'
const TOKEN = localStorage.getItem('token') || ''

/* 通用 JSON 请求：带超时和401兜底 */
async function apiJson(path, { method='GET', body, headers={}, timeout=15000 } = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    console.log('[API]', method, path, { headers: { ...headers }, body })
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        ...headers
      },
      body,
      cache: 'no-store',
      signal: ctrl.signal
    })
    console.log('[API RESP]', method, path, res.status, res.statusText)
    if (res.status === 401) {
      ElMessage.error('登录已过期，请重新登录')
      throw new Error('401 Unauthorized')
    }
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { console.error('[API NON-JSON]', method, path, text.slice(0,200)); throw new Error('非 JSON 响应：' + text.slice(0,120)) }
    console.log('[API JSON]', method, path, json)
    return json
  } catch (e) {
    console.error('[API ERROR]', method, path, e)
    throw e
  } finally {
    clearTimeout(timer)
  }
}

/* 接口兼容层：优先 /submissions；失败时回退 /app/submissions */
async function putAnnotationsWithFallback(sid, payload) {
  try {
    const resp = await apiJson(`/submissions/${sid}/annotations`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    // 如果主路径返回非0，也尝试备用路径
    if (resp?.code !== 0) {
      console.warn('主路径返回非0，尝试备用路径 /app/submissions', resp)
      const resp2 = await apiJson(`/app/submissions/${sid}/annotations`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      return resp2
    }
    return resp
  } catch (e1) {
    console.warn('主路径提交失败，尝试备用路径 /app/submissions', e1)
    const resp2 = await apiJson(`/app/submissions/${sid}/annotations`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return resp2
  }
}
async function getSubmissionDetailFallback(sid) {
  try {
    const resp = await apiJson(`/submissions/${sid}`, { method: 'GET' })
    if (resp?.code !== 0) {
      console.warn('主路径返回非0，尝试备用路径 /app/submissions', resp)
      return await apiJson(`/app/submissions/${sid}`, { method: 'GET' })
    }
    return resp
  } catch (e1) {
    console.warn('主路径读取失败，尝试备用路径 /app/submissions', e1)
    return await apiJson(`/app/submissions/${sid}`, { method: 'GET' })
  }
}

/* 级联配置（只是筛选，不与标注绑定） */
const cascaderProps = { multiple: true, emitPath: true, checkStrictly: false }

/* 图片提交相关状态 */
const uploadRef = ref(null)
const fileList = ref([])
const previewImage = ref('')
const uploading = ref(false)
const submitting = ref(false)
const formRef = ref(null)

// 表单数据
const formData = reactive({
  imageName: '',
  remark: '',
  annotations: []
})

// 图片提交相关路径选择
const selectedSubmitPath = ref([])

/* 列表/筛选/下载 */
function buildTreeFromAssets(files) {
  const root = {}
  files.forEach(({ task_context, file }) => {
    let cur = root
    asStrPath(task_context).forEach((seg, i, arr) => {
      if (!seg) return
      cur[seg] = cur[seg] || { _c: {}, _files: [] }
      if (i === arr.length - 1) cur[seg]._files.push(file)
      cur = cur[seg]._c
    })
  })
  const dfs = node =>
    Object.entries(node).map(([label, obj]) => ({
      label,
      value: label,
      children: dfs(obj._c),
      files: obj._files
    }))
  return dfs(root)
}

const activeTab = ref('scene')
const cascaderOpts = ref([])
const selected = ref([])
const allFiles = ref([])
// 按时间下载相关
const dateRange = ref([])
const loadingTime = ref(false)
const timeSelectedPath = ref([])
const timeFilteredFiles = ref([])
const timeGridPage = ref(1)
const timePageSize = ref(12)
const timeKw = ref('')
const timeSearchMode = ref('name')
const timeSearchWithinPath = ref(false)
const timeDownloadProgress = ref(0)
const timeDownloadingBatch = ref(false)
// 图片预览
const previewVisible = ref(false)
const previewImageUrl = ref('')

/* 拉取素材列表（走代理） */
const load = async () => {
  try {
    const { code, data, message } = await apiJson('/assets')
    if (code !== 0) throw new Error(message || 'assets 接口错误')

    const flat = []
    Object.values(data || {}).flat().forEach(f => {
      flat.push({ task_context: asStrPath(f.task_context), file: f })
    })
    allFiles.value = flat

    const byId  = new Map()
    const byUrl = new Map()
    flat.forEach(({ file, task_context }) => {
      if (file && file.id != null) {
        idToFile.set(file.id, file)
        idToCtx.set(file.id, asStrPath(task_context || []))
        byId.set(Number(file.id), file)
        
        // 增强URL处理逻辑，确保图片可以正确加载
        if (file.file_url) {
          // 1. 检查并修复可能的URL编码问题
          try {
            // 尝试解码后重新编码，修复可能的双重编码问题
            const decodedUrl = decodeURIComponent(file.file_url)
            const reencodedUrl = encodeURI(decodedUrl)
            if (reencodedUrl !== file.file_url) {
              file.file_url = reencodedUrl
              console.log(`已修复URL编码问题: ${file.file_url}`)
            }
          } catch (e) {
            console.warn(`URL解码失败: ${file.file_url}`, e)
          }
          
          // 2. 确保URL格式正确，处理相对路径
          if (!file.file_url.startsWith('http://') && !file.file_url.startsWith('https://') && !file.file_url.startsWith('data:')) {
            // 相对路径处理 - 简单地使用相对路径，让浏览器自动处理
            // 不要随意添加http前缀，避免跨域问题
            console.log(`使用相对路径: ${file.file_url}`)
          }
        }
        
        // 3. 确保custom_name不包含fileName重复内容
        // 当custom_name和fileName非常相似时，可能是后端错误地拼接了
        if (file.custom_name && file.file_name) {
          const fileNameWithoutExt = file.file_name.split('.').slice(0, -1).join('.')
          const customName = file.custom_name.trim()
          
          // 处理custom_name中可能包含的文件名重复部分
          if (customName.includes(fileNameWithoutExt)) {
            // 清理重复的文件名部分
            const cleanName = customName.replace(fileNameWithoutExt, '').trim()
            if (cleanName) {
              file.custom_name = cleanName
              console.log(`已清理重复文件名: ${customName} -> ${cleanName}`)
            }
          }
        }
      }
      if (file?.file_url) byUrl.set(String(file.file_url), file)
    })

    cascaderOpts.value = buildTreeFromAssets(flat)
    selected.value = []
    ElMessage.success('素材列表已更新')
  } catch (e) {
    console.warn(e)
    ElMessage.error('加载素材失败：' + (e?.message || e))
  }
}

/* 图片提交相关方法 */
// 上传前检查
const beforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('上传图片大小不能超过 10MB!')
    return false
  }
  
  // 显示预览
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
  }
  reader.readAsDataURL(file)
  
  return true
}

// 自定义上传处理
const handleUpload = async (options) => {
  uploading.value = true
  const { file } = options
  
  try {
    // 这里只是模拟上传，实际项目中可能需要先上传到文件服务器
    // 由于我们已经在uploadAndSubmitImage中处理了整体流程，这里简单处理
    setTimeout(() => {
      options.onSuccess({})
    }, 500)
  } catch (error) {
    options.onError(error)
  } finally {
    uploading.value = false
  }
}

// 上传成功处理
const onUploadSuccess = () => {
  ElMessage.success('图片上传成功')
}

// 上传失败处理
const onUploadError = (error) => {
  ElMessage.error('图片上传失败：' + (error?.message || '未知错误'))
}

// 添加标注
const addAnnotation = () => {
  formData.annotations.push({
    type: 'label',
    remark: '',
    bounding_box: [0, 0, 0, 0] // 默认空坐标
  })
}

// 移除标注
const removeAnnotation = (index) => {
  formData.annotations.splice(index, 1)
}

// 提交图片
const submitSelectedImage = async () => {
  if (!fileList.length) {
    ElMessage.warning('请先选择图片')
    return
  }
  
  if (!selectedSubmitPath.length) {
    ElMessage.warning('请先选择提交路径')
    return
  }
  
  submitting.value = true
  try {
    const file = fileList[0].raw // 获取选择的文件
    
    // 构建提交的元数据，包含选择的路径
    const metadata = {
      task_context: selectedSubmitPath.value,
      remark: formData.remark,
      annotations: formData.annotations,
      custom_name: formData.imageName || file.name.split('.').slice(0, -1).join('.'),
      cleanupUrl: false // 不清理URL，避免预览失效
    }
    
    // 调用服务层提交图片
    const result = await uploadAndSubmitImage(file, metadata)
    
    ElMessage.success('图片提交成功')
    
    // 重置表单
    resetForm()
    
    // 刷新素材列表
    //await load()

    
    
    return result
  } catch (error) {
    console.error('提交图片失败:', error)
    ElMessage.error('图片提交失败：' + (error.message || '未知错误'))
  } finally {

    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  formData.imageName = ''
  formData.remark = ''
  formData.annotations = []
  fileList.value = []
  previewImage.value = ''
  selectedSubmitPath.value = []
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

/* ========= 搜索与过滤（全新逻辑） ========= */
const kw = ref('')
const searchMode = ref('name') // 'name' | 'id'
const searchWithinPath = ref(false) // 默认不局限路径

const triggerSearch = () => {} // 现为实时过滤，回车无特别动作
const searchPlaceholder = computed(() => (
  searchMode.value === 'id'
    ? '按编号搜索（支持 #123 / id:123 / 123）'
    : '按名称搜索（回车或实时过滤）'
))

// 1) 统一规范化：去 NBSP、合并连续空格、trim
const normSeg = (s) =>
  String(s ?? '')
    .replace(/\u00A0/g, ' ')   // NBSP -> space
    .replace(/\s+/g, ' ')      // 多空格合一
    .trim()

// 2) 把数组路径转成规范化后的字符串数组
const asStrPath = (arr) =>
  Array.isArray(arr) ? arr.map(normSeg).filter(Boolean) : []

// 3) 前缀匹配（基于规范化后的段位逐级比对）
const ctxStartsWith = (ctx = [], path = []) => {
  const a = asStrPath(ctx)
  const b = asStrPath(path)
  for (let i = 0; i < b.length; i++) {
    if ((a[i] ?? '') !== (b[i] ?? '')) return false
  }
  return true
}

/** 规范化关键词：严格按照当前 searchMode 处理（不再“智能”覆盖用户选择） */
const normalizedKw = computed(() => {
  const raw = String(kw.value || '')
  if (searchMode.value === 'id') {
    const m = raw.match(/(\d+)/) // 提取第一段数字，容忍 # / id:
    return m ? m[1] : ''
  }
  // name
  return raw.trim().toLowerCase()
})

const filtered = computed(() => {
  const term = normalizedKw.value
  const hasKw = term.length > 0
  const sel = Array.isArray(selected.value) ? selected.value : []

  const poolAll = allFiles.value.map(o => o.file)
  const poolSelected = sel.length
    ? allFiles.value
        .filter(({ task_context }) => sel.some(path => ctxStartsWith(task_context, path)))
        .map(o => o.file)
    : []

  // 有关键字：决定是否局限于已选路径
  // 无关键字：如果选了路径就展示该路径下全部，否则为空
  const basePool = hasKw
    ? ((sel.length && searchWithinPath.value) ? poolSelected : poolAll)
    : (sel.length ? poolSelected : [])

  if (!hasKw) return basePool

  if (searchMode.value === 'id') {
    return basePool.filter(f => String(f.id ?? '').includes(term))
  } else {
    return basePool.filter(f => String(f.file_name || '').toLowerCase().includes(term))
  }
})

/* 切换模式时可选：保留关键词。若你希望切换清空关键词，解除注释下一行 */
// watch(searchMode, () => { kw.value = '' })

const gridPage = ref(1)
const pageSize = ref(6)
const pagedFiltered = computed(() => filtered.value.slice((gridPage.value - 1) * pageSize.value, (gridPage.value - 1) * pageSize.value + pageSize.value))
watch([filtered, kw, searchMode, searchWithinPath, selected], () => { gridPage.value = 1 })

const reset = () => { selected.value = [] }

/* 下载 */
const downloadOne = async (file) => {
  try {
    const res = await fetch(`${API_BASE}/assets/${file.id}/download`, {
      headers: { Authorization: 'Bearer ' + TOKEN },
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('网络错误 ' + res.status)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    
    // 使用原始文件名进行下载，保持文件扩展名
    a.download = file.file_name
    
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('下载失败：' + e.message)
  }
}

const downloadAll = () => {
  if (!filtered.value.length) { ElMessage.warning('请先勾选标签或输入关键字'); return }
  filtered.value.forEach(downloadOne)
}

// 下载中状态
const downloadingBatch = ref(false)
// 最大允许一次性下载的数量，提高到200以支持更多文件一次性下载
const MAX_BATCH_DOWNLOAD = 200
// 进度相关状态
const downloadProgress = ref(0)
const downloadTotal = ref(0)
const downloadCurrent = ref(0)
const showProgress = ref(false)

// 生成图片信息txt文档
const generateImageInfoTxt = (files) => {
  const lines = ['图片信息列表', '='.repeat(50), '']
  
  files.forEach((file, index) => {
    const fileName = file.file_name || `图片${index + 1}`
    const score = scoreById[file.id] ?? file.score ?? 80
    const tags = quickTagsById[file.id] || file.tags || []
    const tagsStr = Array.isArray(tags) ? tags.join(', ') : String(tags || '')
    
    lines.push(`${index + 1}. ${fileName}`)
    lines.push(`   分数: ${score}`)
    lines.push(`   标签: ${tagsStr}`)
    lines.push('')
  })
  
  lines.push(`总计: ${files.length} 张图片`)
  lines.push(`生成时间: ${new Date().toLocaleString()}`)
  
  return lines.join('\n')
}

const downloadBatch = async () => {
  if (!filtered.value.length) {
    ElMessage.warning('请先勾选标签或输入关键字');
    return 
  }
  
  if (filtered.value.length > 50) {
    ElMessage({ message: `正在准备${filtered.value.length}个文件的下载，请稍候...`, type: 'info' });
  }
  if (filtered.value.length > 100) {
    ElMessage({ message: `检测到文件数量较多(${filtered.value.length}个)，将自动使用分批下载模式以确保下载成功`, type: 'info' });
    return downloadInBatches(filtered.value);
  }
  
  downloadProgress.value = 0
  downloadTotal.value = filtered.value.length
  downloadCurrent.value = 0
  showProgress.value = true
  downloadingBatch.value = true;
  
  try {
    const ids = filtered.value.map(f => f.id)
    downloadTotal.value = ids.length
    ElMessage({ message: '正在准备下载文件，请稍候...', type: 'loading', duration: 0 });
    
    const res = await fetch(`${API_BASE}/assets/batch_download`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: 'Bearer ' + TOKEN 
      },
      body: JSON.stringify({ submission_ids: ids }),
      cache: 'no-store',
      signal: AbortSignal.timeout(filtered.value.length > 50 ? 300000 : 120000)
    })
    
    const ctype = res.headers.get('content-type') || ''
      
    if (res.body && res.headers.has('content-length')) {
      const contentLength = parseInt(res.headers.get('content-length') || '0')
      let downloaded = 0
      const reader = res.body.getReader()
      const stream = new ReadableStream({
        start(controller) {
          let lastUpdateTime = 0
          const updateProgress = (downloaded, contentLength) => {
            const now = performance.now()
            if (now - lastUpdateTime > 16) {
              downloadProgress.value = Math.round((downloaded / contentLength) * 100)
              lastUpdateTime = now
            }
          }
          function push() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close()
                downloadProgress.value = 100
                return
              }
              downloaded += value.byteLength
              updateProgress(downloaded, contentLength)
              controller.enqueue(value)
              push()
            })
          }
          push()
        }
      })
      const blob = await new Response(stream).blob()
      const now = new Date();
      const dateTime = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      let pathName = '素材批量';
      if (selected.value.length > 0) {
        if (selected.value.length === 1) {
          pathName = formatPath(selected.value[0]);
        } else {
          const paths = selected.value.map(p => asStrPath(p));
          let commonPrefix = [];
          let hasCommonPrefix = true;
          let level = 0;
          while (hasCommonPrefix) {
            const currentLevelValues = paths.map(p => p[level]).filter(v => v !== undefined);
            if (currentLevelValues.length === 0) break;
            const firstValue = currentLevelValues[0];
            hasCommonPrefix = currentLevelValues.every(v => v === firstValue);
            if (hasCommonPrefix) {
              commonPrefix.push(firstValue);
              level++;
            }
          }
          if (commonPrefix.length > 0) {
            pathName = commonPrefix.join(' / ');
          } else {
            pathName = paths[0][0] || '素材批量';
          }
        }
      }
      const cleanPathName = pathName.replace(/[/\\:*?"<>|]/g, '_');
      const fname = `${cleanPathName}${dateTime}.zip`;
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fname
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 100)
      
      // 生成并下载txt文档
      const txtContent = generateImageInfoTxt(filtered.value)
      const txtBlob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' })
      const txtUrl = window.URL.createObjectURL(txtBlob)
      const txtA = document.createElement('a')
      txtA.href = txtUrl
      txtA.download = `${cleanPathName}${dateTime}_图片信息.txt`
      document.body.appendChild(txtA)
      txtA.click()
      setTimeout(() => {
        document.body.removeChild(txtA)
        window.URL.revokeObjectURL(txtUrl)
      }, 200)
    } else if (ctype.includes('application/zip')) {
      const contentLength = parseInt(res.headers.get('content-length') || '0')
      if (contentLength > 0) {
        let simulatedProgress = 0
        const progressInterval = setInterval(() => {
          simulatedProgress += Math.min(5, 100 - simulatedProgress)
          downloadProgress.value = simulatedProgress
          if (simulatedProgress >= 100) {
            clearInterval(progressInterval)
          }
        }, 300)
      }
      const blob = await res.blob()
      const fname = `素材批量_${new Date().toISOString().slice(0, 10)}.zip`
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fname
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        downloadProgress.value = 100
      }, 100)
      
      // 生成并下载txt文档
      const txtContent = generateImageInfoTxt(filtered.value)
      const txtBlob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' })
      const txtUrl = window.URL.createObjectURL(txtBlob)
      const txtA = document.createElement('a')
      txtA.href = txtUrl
      txtA.download = `素材批量_${new Date().toISOString().slice(0, 10)}_图片信息.txt`
      document.body.appendChild(txtA)
      txtA.click()
      setTimeout(() => {
        document.body.removeChild(txtA)
        window.URL.revokeObjectURL(txtUrl)
      }, 200)
    } else {
      const { code, data, message } = await res.json()
      if (code !== 0 || !data?.url) throw new Error(message || '获取下载链接失败')
      window.open(data.url, '_blank')
    }
      
    downloadProgress.value = 100
    ElMessage.success('批量下载已开始')
  } catch (e) {
    if (e.name === 'TimeoutError') {
      if (filtered.value.length > 50) {
        ElMessage.error(`下载超时。对于${filtered.value.length}个文件，建议使用分批下载模式以提高成功率`)
      } else {
        ElMessage.error('下载超时，请稍后再试')
      }
    } else if (e.name === 'AbortError') {
      ElMessage.warning('下载已取消')
    } else {
      ElMessage.error('批量下载失败：' + e.message)
    }
  } finally {
    ElMessage.closeAll()
    downloadingBatch.value = false;
    showProgress.value = false;
  }
}

// 分批下载函数
const downloadInBatches = async (files) => {
  const totalFiles = files.length;
  const dynamicBatchSize = totalFiles > 500 ? 50 : (totalFiles > 200 ? 100 : MAX_BATCH_DOWNLOAD);
  const batches = Math.ceil(totalFiles / dynamicBatchSize);
  
  downloadProgress.value = 0
  downloadTotal.value = totalFiles
  downloadCurrent.value = 0
  showProgress.value = true
  downloadingBatch.value = true
  
  ElMessage.info(`即将开始分批下载，共${batches}批，每批${dynamicBatchSize}个文件，总计${totalFiles}个文件`);
  
  const downloadNextBatch = async (batchIndex) => {
    if (batchIndex >= batches) {
      ElMessage.success('全部批次下载完成');
      return;
    }
    
    const startIdx = batchIndex * dynamicBatchSize;
    const endIdx = Math.min(startIdx + dynamicBatchSize, totalFiles);
    const batchFiles = files.slice(startIdx, endIdx);
    
    const currentFileRange = `${startIdx + 1}-${endIdx}`;
    ElMessage({ message: `正在下载第${batchIndex + 1}/${batches}批文件 (${currentFileRange}/${totalFiles})...`, type: 'loading', duration: 0 });
    
    try {
      const ids = batchFiles.map(f => f.id);
      const timeoutTime = dynamicBatchSize > 100 ? 300000 : 180000;
      const res = await fetch(`${API_BASE}/assets/batch_download`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: 'Bearer ' + TOKEN 
        },
        body: JSON.stringify({ submission_ids: ids }),
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutTime)
      });
      
      const ctype = res.headers.get('content-type') || '';
      if (ctype.includes('application/zip')) {
        const blob = await res.blob();
        const now = new Date();
        const dateTime = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        let pathName = '素材批量';
        if (selected.value.length > 0) {
          if (selected.value.length === 1) {
            pathName = formatPath(selected.value[0]);
          } else {
            const paths = selected.value.map(p => asStrPath(p));
            let commonPrefix = [];
            let hasCommonPrefix = true;
            let level = 0;
            while (hasCommonPrefix) {
              const currentLevelValues = paths.map(p => p[level]).filter(v => v !== undefined);
              if (currentLevelValues.length === 0) break;
              const firstValue = currentLevelValues[0];
              hasCommonPrefix = currentLevelValues.every(v => v === firstValue);
              if (hasCommonPrefix) {
                commonPrefix.push(firstValue);
                level++;
              }
            }
            if (commonPrefix.length > 0) {
              pathName = commonPrefix.join(' / ');
            } else {
              pathName = paths[0][0] || '素材批量';
            }
          }
        }
        const cleanPathName = pathName.replace(/[/\\:*?"<>|]/g, '_');
        const fname = `${cleanPathName}${dateTime}_part${batchIndex + 1}.zip`;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fname;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          downloadCurrent.value = endIdx;
          downloadProgress.value = Math.round((endIdx / totalFiles) * 100);
          setTimeout(() => downloadNextBatch(batchIndex + 1), 1000);
        }, 100);
        
        // 生成并下载txt文档（仅第一批）
        if (batchIndex === 0) {
          const txtContent = generateImageInfoTxt(files)
          const txtBlob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' })
          const txtUrl = window.URL.createObjectURL(txtBlob)
          const txtA = document.createElement('a')
          txtA.href = txtUrl
          txtA.download = `${cleanPathName}${dateTime}_图片信息.txt`
          document.body.appendChild(txtA)
          txtA.click()
          setTimeout(() => {
            document.body.removeChild(txtA)
            window.URL.revokeObjectURL(txtUrl)
          }, 200)
        }
      } else {
        const { code, data, message } = await res.json();
        if (code !== 0 || !data?.url) {
          throw new Error(message || '获取下载链接失败');
        }
        window.open(data.url, '_blank');
        downloadCurrent.value = endIdx;
        downloadProgress.value = Math.round((endIdx / totalFiles) * 100);
        setTimeout(() => downloadNextBatch(batchIndex + 1), 1000);
      }
    } catch (e) {
      ElMessage.closeAll();
      ElMessage.error(`第${batchIndex + 1}批下载失败：${e.message}`);
      try {
        await ElMessageBox.confirm('是否继续下载下一批文件？', '下载失败', {
          confirmButtonText: '继续',
          cancelButtonText: '取消',
          type: 'warning'
        })
        downloadNextBatch(batchIndex + 1);
      } catch {
        // 用户取消
      }
    } finally {
      if (batchIndex >= batches - 1) {
        downloadingBatch.value = false
        showProgress.value = false
      }
      ElMessage.closeAll();
    }
  };
  downloadNextBatch(0);
}

/* ====== 右侧面板：分数 + 图片级标签（不再支持“整图添加”） ====== */
const annoCache = reactive({})            // id -> [{bbox, remark}]
const scoreById = reactive({})            // id -> number
const quickTagsById = reactive({})        // id -> string[]
const submitStatusById = reactive({})     // id -> status text
const quickSavingId = ref(null)
// 初始化customNameById，不再从localStorage加载，直接返回空对象
const initCustomNameById = () => {
  console.log('[初始化] 不再从localStorage加载自定义名称，使用空对象初始化')
  return {}
}
const customNameById = reactive(initCustomNameById()) // id -> custom_name
const lastRefreshKey = ref(0) // 用于触发强制刷新

// 自定义名称保存函数，不再保存到localStorage
const saveCustomNameById = () => {
  console.log('[持久化] 不再保存自定义名称到localStorage，数据将从后端获取')
  // 计算当前映射数量用于调试
  const currentSize = Object.keys(customNameById).length
  console.log(`[持久化] 当前内存中的自定义名称映射数: ${currentSize}`)
  // 返回true以保持向后兼容性
  return true
}

// 添加通知接收机制，用于接收来自ImageSubmissionForm的新提交通知
window.__notifyNewSubmission = (submissionId, customName, fileData) => {
  console.log('[通知接收] 收到新提交通知:', 
    { 
      submissionId: submissionId, 
      customName: customName, 
      fileDataExists: !!fileData,
      fileDataId: fileData?.id,
      fileDataCustomName: fileData?.custom_name
    } 
  )
  
  // 验证必要参数
  if (!submissionId || submissionId === 'undefined' || submissionId === 'null') {
    console.error('[通知接收] 错误：submissionId无效或为空:', submissionId)
    return
  }
  
  // 直接使用fileData.custom_name，确保它正确设置
  if (fileData && typeof fileData === 'object') {
    // 即使fileData.custom_name为空，也要确保它存在
    if (!('custom_name' in fileData)) {
      fileData.custom_name = ''
      console.log(`[通知接收] fileData中不存在custom_name字段，初始化为空字符串`)
    }
    
    const finalCustomName = String(fileData.custom_name || '').trim()
    console.log(`[通知接收] 使用fileData.custom_name: '${finalCustomName}'`)
    
    // 如果传入的customName非空且与fileData.custom_name不同，则更新fileData.custom_name
    const trimmedCustomName = String(customName || '').trim()
    if (trimmedCustomName && trimmedCustomName !== finalCustomName) {
      fileData.custom_name = trimmedCustomName
      console.log(`[通知接收] 使用传入的customName更新fileData.custom_name: '${trimmedCustomName}'`)  
    }
  } else {
    console.log('[通知接收] 警告：fileData为null或undefined')
  }
  
  // 不再需要保存到localStorage，custom_name将从服务器获取
  // 触发显示刷新
  console.log('[通知接收] 触发强制显示刷新')
  forceRefreshDisplay()
  
  console.log('[通知接收] 通知处理完成（不再使用localStorage存储custom_name）')
}

/* 获取正确的显示名称，优先显示custom_name，否则显示file_name */
const getDisplayName = (file) => {
  if (!file) return '未知图片'
  
  // 优先使用custom_name（如果不为空）
  if (file.custom_name !== undefined && file.custom_name !== null) {
    const customName = String(file.custom_name).trim()
    if (customName) {
      return customName
    }
  }
  
  // 如果custom_name为空或不存在，则使用原始文件名
  if (file.file_name) {
    return file.file_name
  }
  
  // 最后返回默认值
  return '未知图片'
}

/* 触发DOM强制刷新 */
const forceRefreshDisplay = () => {
  console.log('[显示逻辑] 触发强制刷新')
  lastRefreshKey.value++
}

/* 重命名相关状态 */
const renameDialogVisible = ref(false)
const renameTargetFile = ref(null)
const newCustomName = ref('')

/* 侧栏预览：用列表已有字段填充 */
const fetchAnnosForFile = async (file) => {
  console.log('[服务器同步] 开始fetchAnnosForFile，文件信息:', 
    { 
      id: file?.id, 
      submission_id: file?.submission_id, 
      file_name: file?.file_name, 
      custom_name: file?.custom_name,
      hasServerCustomName: file?.custom_name !== undefined && file?.custom_name !== null
    }
  )
  
  if (!file || !file.id) {
    console.error('[服务器同步] 错误：文件对象无效或缺少id字段')
    return
  }
  
  // 确保id类型一致
  const fileIdStr = String(file.id)
  console.log(`[服务器同步] 标准化文件ID为字符串: ${fileIdStr}`)
  
  // 尝试所有可能的key查找现有映射
  const existingName = customNameById[fileIdStr]
  const submissionIdStr = file.submission_id ? String(file.submission_id) : null
  const submissionName = submissionIdStr ? customNameById[submissionIdStr] : null
  
  console.log(`[服务器同步] 现有映射状态: fileId=${fileIdStr} -> ${existingName}, submissionId=${submissionIdStr} -> ${submissionName}`)
  
  // 优先从file.custom_name读取服务器返回的自定义名称
  if (file.custom_name !== undefined && file.custom_name !== null) {
    const serverCustomName = String(file.custom_name).trim()
    console.log(`[服务器同步] 从服务器获取的custom_name: '${serverCustomName}' 用于文件ID: ${fileIdStr}`)
    
    // 如果服务器返回的custom_name不为空，则使用它
    if (serverCustomName) {
      // 更新file.id对应的key
      customNameById[fileIdStr] = serverCustomName
      console.log(`[服务器同步] 更新file.id对应的custom_name: ${fileIdStr} = ${serverCustomName}`)
      
      // 如果file也有submission_id，同时更新对应的key
      if (submissionIdStr) {
        customNameById[submissionIdStr] = serverCustomName
        console.log(`[服务器同步] 同时更新submission_id对应的custom_name: ${submissionIdStr} = ${serverCustomName}`)
      }
      
      // 尝试反向映射：如果有其他key映射到这个文件
      for (const [key, value] of Object.entries(customNameById)) {
        // 如果找到其他key使用相同的custom_name，也尝试建立关联
        if (key !== fileIdStr && key !== submissionIdStr && String(value).trim() === serverCustomName) {
          console.log(`[服务器同步] 发现潜在关联key: ${key}，也映射到相同名称`)
        }
      }
      
      // 保存到localStorage
      console.log('[服务器同步] 保存更新到localStorage...')
      saveCustomNameById()
      
      // 强制刷新显示
      forceRefreshDisplay()
    }
    // 注意：不要覆盖为空，空值应该保持localStorage中的现有值
  }
  
  // 处理其他元数据
  const list = Array.isArray(file.annotations) ? file.annotations : []
  annoCache[file.id] = list
    .filter(a => Array.isArray(a.bounding_box) && a.bounding_box.length === 4)
    .map(a => ({ bbox: a.bounding_box.map(Number), remark: String(a.remark || '') }))
  if (scoreById[file.id] == null) scoreById[file.id] = Number(file.score ?? 80)
  if (!Array.isArray(quickTagsById[file.id])) quickTagsById[file.id] = Array.isArray(file.tags) ? file.tags.slice() : []
}

/* 删除本地某条标注（不立刻提交） */
const removeAnno = (id, idx) => {
  const list = annoCache[id] || []
  if (idx >= 0 && idx < list.length) list.splice(idx, 1)
}

const onQuickSliderChange = (file) => {
  const v = Math.max(0, Math.min(100, Number(scoreById[file.id] ?? 0)))
  scoreById[file.id] = v
}

/* 处理快速标签变化 */
const onQuickTagsChange = (file) => {
  // 确保quickTagsById[file.id]是数组
  if (!Array.isArray(quickTagsById[file.id])) {
    quickTagsById[file.id] = []
  }
}

/* 更新自定义名称 */
const updateCustomName = async (file, newName) => {
  // 确保file对象有效
  if (!file || !file.id) {
    ElMessage.error('文件信息无效，无法更新名称')
    return
  }
  
  // 当新名称不为空时，使用输入的内容
  const finalName = newName.trim()
  
  try {
    // 调用后端API持久化重命名操作
    await renameSubmissionImage(file.id, finalName)
    
    // 更新前端内存中的状态
    // 更新自定义名称映射
    customNameById[file.id] = finalName
    
    // 更新allFiles数组中的file对象
    allFiles.value.forEach(f => {
      if (f.file && f.file.id === file.id) {
        f.file.custom_name = finalName
      }
    })
    
    // 更新idToFile Map中的file对象
    if (idToFile.has(file.id)) {
      const fileInMap = idToFile.get(file.id)
      fileInMap.custom_name = finalName
    }
    
    // 更新timeFilteredFiles数组中的文件对象（按时间下载功能）
    timeFilteredFiles.value.forEach(f => {
      if (f.id === file.id) {
        f.custom_name = finalName
      }
    })
    
    ElMessage.success(finalName ? '图片备注名已更新' : '已清除自定义名称，将使用原始文件名')
    
    // 强制刷新显示
    forceRefreshDisplay()
  } catch (error) {
    console.error('更新自定义名称失败:', error)
    ElMessage.error('更新失败：' + (error.message || '未知错误'))
  }
}

/* 打开重命名对话框 */
const openRenameDialog = (file) => {
  renameTargetFile.value = file
  newCustomName.value = customNameById[file.id] || file.custom_name || (file.file_name ? file.file_name.split('.').slice(0, -1).join('.') : '')
  renameDialogVisible.value = true
}

/* 确认重命名 */
const confirmRename = async () => {
  if (!renameTargetFile.value) {
    renameDialogVisible.value = false
    return
  }
  
  await updateCustomName(renameTargetFile.value, newCustomName.value)
  renameDialogVisible.value = false
}

/* 通过 URL 拿 submission_id（走代理） */
const getSubmissionIdForFile = async (file) => {
  // 始终以 /assets/url 的返回为准，避免 id 混淆
  const { data } = await apiJson(`/assets/url?image_url=${encodeURIComponent(file.file_url)}`)
  if (data?.submission_id != null) return Number(data.submission_id)
  // 兜底：如果 file.id 存在，尝试作为 submission_id 使用
  if (file?.id != null) return Number(file.id)
  throw new Error('未找到 submission_id')
}

/* 快捷提交（图片级 score/tags + 当前标注列表） */
const submitQuickScore = async (file) => {
  submitStatusById[file.id] = '提交中'

  const unified = Math.max(0, Math.min(100, Number(scoreById[file.id] ?? 0)))
  const imgTags = Array.isArray(quickTagsById[file.id]) ? quickTagsById[file.id].map(s => String(s).trim()).filter(Boolean) : []
  const annos = (annoCache[file.id] || []).map(a => ({
      type:'label',
      remark: a?.remark || '',
      bounding_box: a?.bbox,
      score: unified
    }))

  try {
    quickSavingId.value = file.id
    ElMessage.info('正在提交到后端…')
    const sid = await getSubmissionIdForFile(file)
    console.log('[PUT] /submissions/' + sid + '/annotations payload:', { annotations: annos, tags: imgTags, score: unified })
    const { code, message } = await putAnnotationsWithFallback(sid, { annotations: annos, tags: imgTags, score: unified })
    console.log('[RESP] 提交/annotations:', { code, message })
    if (code !== 0) throw new Error(message || '后端返回失败')
    ElMessage.success('后端已接收，正在刷新分数…')
    // 提交后读取详情以验证服务端分数
    try {
      const detail = await getSubmissionDetailFallback(sid)
      console.log('[GET] 详情:', detail)
       const srvScore = Number(detail?.data?.score ?? unified)
       if (Number.isFinite(srvScore)) scoreById[file.id] = srvScore
    } catch (err) {
      console.warn('读取提交详情失败，使用本地分数', err)
      scoreById[file.id] = unified
    }
    // 本地更新并刷新元数据，确保展示与后端一致
    quickTagsById[file.id] = imgTags.slice()
    ElMessage.success('已提交图片分数/标签与标注')
    submitStatusById[file.id] = '成功，分数已刷新'
    await refreshFileMeta(file)
  
  } catch (e) {
    ElMessage.error('提交失败：' + (e?.message || e))
    try { submitStatusById[file.id] = '失败：' + (e?.message || e) } catch {}
  } finally {
    quickSavingId.value = null
  }
}

/* 从 /assets/url 刷新单图 */
const refreshFileMeta = async (file) => {
  try {
    const { data } = await apiJson(`/assets/url?image_url=${encodeURIComponent(file.file_url)}`)
    console.log('[GET] /assets/url data for', file.file_url, data)
    if (!data) return
    // 优先使用 /assets/url 的分数；若仍为默认80，尝试从 /submissions/{sid} 获取（失败再回退 /app/submissions）
    let srvScore = Number(data.score ?? 80)
    try {
      const sid = await getSubmissionIdForFile(file)
      const detail = await getSubmissionDetailFallback(sid)
      const detailScore = Number(detail?.data?.score)
      if (Number.isFinite(detailScore)) srvScore = detailScore
    } catch (e) {
      // 忽略详情查询错误，仅记录日志
      console.warn('获取提交详情用于校正分数失败', e)
    }
    scoreById[file.id] = Number.isFinite(srvScore) ? srvScore : Number(scoreById[file.id] ?? 80)
    quickTagsById[file.id] = Array.isArray(data.tags) ? data.tags.slice() : []
    annoCache[file.id] = (Array.isArray(data.annotations) ? data.annotations : [])
      .filter(a => Array.isArray(a.bounding_box) && a.bounding_box.length === 4)
      .map(a => ({ bbox: a.bounding_box.map(Number), remark: String(a.remark || '') }))
    
    // 更新timeFilteredFiles数组中的文件对象（按时间下载功能）
    timeFilteredFiles.value.forEach(f => {
      if (f.id === file.id) {
        f.score = srvScore
        f.tags = Array.isArray(data.tags) ? data.tags.slice() : []
      }
    })
  } catch (e) {
    console.warn('刷新单图元数据失败', e)
  }
}

/* ===== 评分/标注（弹窗） ===== */
const rateVisible = ref(false)
const rateSubmitting = ref(false)
const rateLoadingHistory = ref(false)
const rateTarget = ref(null)
const rateForm = reactive({ remark: '' })
const imageScore = ref(80)   // 图片级
const imageTags  = ref([])   // 图片级

const historyBoxes = ref([])
const historyOriginals = ref([])
const activeHistoryIdx = ref(-1)
const openSet = reactive(new Set())
const isOpen = (i) => openSet.has(i)
const toggleCard = (i) => { isOpen(i) ? openSet.delete(i) : openSet.add(i) }
const newBoxes = ref([])

/* 绘制/坐标换算 */
const stageRef = ref(null)
const stageImg = ref(null)
const imgNatural = reactive({ w: 0, h: 0 })
const imgDisplay = reactive({ w: 0, h: 0 })
const draw = reactive({ active: false, x1: 0, y1: 0, x2: 0, y2: 0 })
const hasBox = computed(() => Math.abs(draw.x2 - draw.x1) > 1 && Math.abs(draw.y2 - draw.y1) > 1)
const boxStyle = computed(() => {
  const l = Math.min(draw.x1, draw.x2), t = Math.min(draw.y1, draw.y2)
  const w = Math.abs(draw.x2 - draw.x1), h = Math.abs(draw.y2 - draw.y1)
  return { left: `${l}px`, top: `${t}px`, width: `${w}px`, height:`${h}px` }
})
const scale = computed(() => ({ sx: imgDisplay.w ? imgNatural.w / imgDisplay.w : 1, sy: imgDisplay.h ? imgNatural.h / imgDisplay.h : 1 }))
const toStageStyle = (bbox=[0,0,0,0]) => {
  const [x1,y1,x2,y2] = bbox
  const l = Math.min(x1,x2) / (scale.value.sx || 1)
  const t = Math.min(y1,y2) / (scale.value.sy || 1)
  const w = Math.abs(x2-x1) / (scale.value.sx || 1)
  const h = Math.abs(y2-y1) / (scale.value.sy || 1)
  return { left:`${l}px`, top:`${t}px`, width:`${w}px`, height:`${h}px` }
}
const naturalBoxOfDraft = computed(() => {
  if (!hasBox.value) return [0,0,0,0]
  const l = Math.min(draw.x1, draw.x2), t = Math.min(draw.y1, draw.y2)
  const r = Math.max(draw.x1, draw.x2), b = Math.max(draw.y1, draw.y2)
  const { sx, sy } = scale.value
  return [Math.round(l*sx), Math.round(t*sy), Math.round(r*sx), Math.round(b*sy)]
})
const getStageMetrics = () => {
  const el = stageRef.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  return { left: rect.left + el.clientLeft, top: rect.top + el.clientTop, width: el.clientWidth, height: el.clientHeight }
}
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

/* 改造 pickLocal：考虑 pan / zoom，把鼠标位置转换为“未缩放坐标系”的点 */
const pickLocal = (e) => {
  const stage = stageRef.value
  if (!stage) return { x: 0, y: 0 }
  const rect = stage.getBoundingClientRect()
  // 鼠标相对 draw-stage 左上角的像素
  const rx = e.clientX - (rect.left + stage.clientLeft)
  const ry = e.clientY - (rect.top  + stage.clientTop)
  // 反向应用 pan/zoom 得到逻辑坐标
  const x = (rx - pan.x) / (zoom.value || 1)
  const y = (ry - pan.y) / (zoom.value || 1)
  // 限制在当前显示尺寸（未缩放尺寸）
  const w = stageImg.value?.clientWidth  || 0
  const h = stageImg.value?.clientHeight || 0
  return { x: clamp(x, 0, w), y: clamp(y, 0, h) }
}

/* 支持空格 + 拖拽平移（不影响左键画框） */
function onKeyDown(e){ if (e.code === 'Space') spaceDown.value = true }
function onKeyUp(e){ if (e.code === 'Space') spaceDown.value = false }
window.addEventListener('keydown', onKeyDown)
window.addEventListener('keyup', onKeyUp)

/* 改造鼠标事件：空格按下时为平移模式，否则保持原画框逻辑 */
const onStageDown = (e) => {
  // 平移模式（空格按下 + 左键 / 中键 / 右键任意键）
  if (spaceDown.value && (e.button===0 || e.button===1 || e.button===2)) {
    e.preventDefault()
    const stage = stageRef.value
    const rect = stage.getBoundingClientRect()
    panning.value = true
    panStart.x = pan.x
    panStart.y = pan.y
    panStart.mx = e.clientX - (rect.left + stage.clientLeft)
    panStart.my = e.clientY - (rect.top  + stage.clientTop)
    return
  }
  // 否则进入画框
  if (e.button!==0) return
  const {x,y}=pickLocal(e)
  draw.active=true; draw.x1=draw.x2=x; draw.y1=draw.y2=y
}

const onStageMove = (e) => {
  if (panning.value) {
    const stage = stageRef.value
    const rect = stage.getBoundingClientRect()
    const mx = e.clientX - (rect.left + stage.clientLeft)
    const my = e.clientY - (rect.top  + stage.clientTop)
    pan.x = panStart.x + (mx - panStart.mx)
    pan.y = panStart.y + (my - panStart.my)
    return
  }
  if (!draw.active) return
  const {x,y}=pickLocal(e)
  draw.x2=x; draw.y2=y
}

const onStageUp = () => { draw.active=false; panning.value=false }

const clearBox = () => { draw.x1 = draw.y1 = draw.x2 = draw.y2 = 0 }

/* 打开标注弹窗（仅与图片绑定） */
const ro = ref(null)
const openRate = async (file) => {
  rateTarget.value = file
  rateForm.remark=''; newBoxes.value=[]; historyBoxes.value=[]; historyOriginals.value=[]; activeHistoryIdx.value=-1; openSet.clear(); clearBox()
  imageTags.value = []
  rateVisible.value = true
  await nextTick()
  await onImgLoad()
  if (stageRef.value && !ro.value) {
    ro.value = new ResizeObserver(() => {
      if (!stageImg.value) return
      imgDisplay.w = stageImg.value.clientWidth || 0
      imgDisplay.h = stageImg.value.clientHeight || 0
      fitCanvas()
    })
    ro.value.observe(stageRef.value)
  }
  await fetchHistory(file)
}

// 处理图片加载错误
const handleImageError = (event, url) => {
  // 提取文件名（如果有）用于更友好的错误提示
  let fileName = '图片';
  if (url) {
    try {
      const urlObj = new URL(url);
      // 从路径中提取文件名
      const pathParts = urlObj.pathname.split('/');
      fileName = pathParts[pathParts.length - 1] || '图片';
    } catch (e) {
      // 如果URL解析失败，尝试直接从字符串中提取
      if (url.includes('/')) {
        const pathParts = url.split('/');
        fileName = pathParts[pathParts.length - 1] || '图片';
      }
    }
  }
  
  // 记录详细错误信息
  console.error(`图片加载失败: ${fileName}`, { url, error: event.error });
  
  // 更友好的错误提示，避免在UI中显示完整URL
  ElMessage.warning(`图片无法加载: ${fileName}`);
  
  // 设置默认占位图片，使用内联SVG作为默认图片
  event.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
  
  // 添加错误状态类，方便样式处理
  event.target.classList.add('image-load-error');
}

const onImgLoad = async () => {
  const img = stageImg.value
  if (!img) return
  imgNatural.w = img.naturalWidth || 0
  imgNatural.h = img.naturalHeight || 0
  await nextTick()
  imgDisplay.w = img.clientWidth || 0
  imgDisplay.h = img.clientHeight || 0
  // 重置视图
    fitCanvas()
}

/* 历史（弹窗）——来自 /assets/url */
const fetchHistory = async (file) => {
  rateLoadingHistory.value = true
  try {
    const { code, data } = await apiJson(`/assets/url?image_url=${encodeURIComponent(file.file_url)}`)
    if (code !== 0 || !data) {
      historyBoxes.value=[]; historyOriginals.value=[]; imageScore.value = scoreById[file.id] ?? 80; imageTags.value = []
      return
    }
    const hb = (Array.isArray(data.annotations) ? data.annotations : [])
      .filter(a => Array.isArray(a.bounding_box) && a.bounding_box.length === 4)
      .map(a => ({ bbox:a.bounding_box.map(Number), remark:String(a.remark||''), exmid: (a.exmid ?? a.id ?? a.uuid ?? undefined), checked:true }))
    historyBoxes.value = hb
    historyOriginals.value = JSON.parse(JSON.stringify(hb))

    imageScore.value = Number(data.score ?? 80)
    imageTags.value  = Array.isArray(data.tags) ? data.tags.map(t=>String(t).trim()).filter(Boolean) : []

    scoreById[file.id]     = imageScore.value
    quickTagsById[file.id] = imageTags.value.slice()
    annoCache[file.id]     = hb.map(({bbox,remark,exmid})=>({bbox,remark,exmid}))
  } catch (e) {
    historyBoxes.value = []
    historyOriginals.value = []
    imageScore.value = scoreById[file.id] ?? 80
    imageTags.value = []
    console.warn('历史标注获取失败', e)
  } finally { rateLoadingHistory.value = false }
}

const saveCurrentBox = () => {
  if (!hasBox.value) return
  const bbox = naturalBoxOfDraft.value.slice()
  newBoxes.value.push({ bbox, remark: '', checked: true })
  clearBox()
}
const removeNew = (idx) => { newBoxes.value.splice(idx,1) }

/* ====== 缩放 / 平移（仅弹窗内绘制区）====== */
const canvasRef = ref(null)
const zoom = ref(1)
const zoomMin = 0.5
const zoomMax = 4
const zoomStep = 0.25

// 画布平移（单位：像素，作用于未缩放坐标系）
const pan = reactive({ x: 0, y: 0 })
const panning = ref(false)
const panStart = reactive({ x: 0, y: 0, mx: 0, my: 0 })
const spaceDown = ref(false)

const canvasTransform = computed(() => ({
  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom.value})`,
  transformOrigin: 'top left',
}))

function zoomIn()  { zoom.value = Math.min(zoomMax, +(zoom.value + zoomStep).toFixed(2)) }

function fitCanvas() {
  const stage = stageRef.value
  const img = stageImg.value
  if (!stage || !img) return

  // 当前容器尺寸（可视区）
  const sw = stage.clientWidth
  const sh = stage.clientHeight

  // 当前图片“显示尺寸”（不是 natural 尺寸）
  const iw = img.clientWidth  || 1
  const ih = img.clientHeight || 1

  // 基准缩放：100% = 以 CSS 显示尺寸为基准
  zoom.value = 1

  // 在未缩放坐标系下居中（pan 作用在未缩放坐标）
  pan.x = (sw - iw) / 2
  pan.y = (sh - ih) / 2
}

function zoomOut() { zoom.value = Math.max(zoomMin, +(zoom.value - zoomStep).toFixed(2)) }
function zoomReset(){ zoom.value = 1 }

function onWheel(e){
  // 按住 Ctrl 时再启用滚轮缩放，避免误触
  if (!e.ctrlKey) return
  e.preventDefault()
  const delta = e.deltaY
  if (delta>0) zoomOut(); else zoomIn()
}
onMounted(()=> { stageRef.value?.addEventListener('wheel', onWheel, { passive:false }) })
onBeforeUnmount(()=> {
  stageRef.value?.removeEventListener('wheel', onWheel)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})

/* 弹窗提交：图片级 score/tags + 选择的标注框 */
const submitRate = async () => {
  const file = rateTarget.value
  if (!file) return
  if (hasBox.value) saveCurrentBox()

  // 弹窗提交也先给出提示，辅助定位点击事件
  ElMessage.info('已点击弹窗中的提交按钮')
  try { window.alert('开始弹窗提交：' + (file?.file_name || file?.id || '未知图片')) } catch {}

  const unified = Math.max(0, Math.min(100, Number(imageScore.value || 0)))
  const uniTags  = (Array.isArray(imageTags.value) ? imageTags.value.map(s=>String(s).trim()).filter(Boolean).sort() : [])

  const selectedHistory = historyBoxes.value.filter(hb => hb.checked)
  const selectedNew     = newBoxes.value.filter(nb => nb.checked)

  const annotations = [
    ...selectedHistory.map(hb => ({
        type:'label',
        remark: ((hb?.remark||'') + (rateForm.remark?` ${rateForm.remark}`:'')).trim(),
        bounding_box: hb?.bbox?.slice(0,4),
        score: unified
      })),
    ...selectedNew.map(nb => ({ type:'label', remark: ((nb.remark||'') + (rateForm.remark?` ${rateForm.remark}`:'')).trim(), bounding_box: nb.bbox.slice(0,4), score: unified }))
  ]

  try {
    rateSubmitting.value = true
    ElMessage.info('正在提交到后端…')
    const sid = await getSubmissionIdForFile(file)
    console.log('[PUT] /submissions/' + sid + '/annotations payload:', { annotations, tags: uniTags, score: unified })
    const { code, message } = await putAnnotationsWithFallback(sid, { annotations, tags: uniTags, score: unified })
    console.log('[RESP] 提交/annotations:', { code, message })
    if (code !== 0) throw new Error(message || '后端返回失败')
    ElMessage.success('后端已接收，正在刷新分数…')

    // 提交后读取详情以验证服务端分数
    try {
      const detail = await getSubmissionDetailFallback(sid)
       console.log('[GET] 详情:', detail)
       const srvScore = Number(detail?.data?.score ?? unified)
       if (Number.isFinite(srvScore)) scoreById[file.id] = srvScore
       else scoreById[file.id] = unified
    } catch (err) {
      console.warn('读取提交详情失败，使用本地分数', err)
      scoreById[file.id] = unified
    }

    ElMessage.success('标注/分数/标签提交成功')
    quickTagsById[file.id] = uniTags.slice()
    submitStatusById[file.id] = '成功，分数已刷新'
    await refreshFileMeta(file)
    rateVisible.value = false
  } catch (e) {
    ElMessage.error('提交失败：' + (e?.message || e))
    try { submitStatusById[file.id] = '失败：' + (e?.message || e) } catch {}
  } finally {
    rateSubmitting.value = false
  }
}

/* ======= 新增：图片删除 ======= */
const deletingId = ref(null)
const removeFileById = (id) => {
  // 从列表中移除
  const idx = allFiles.value.findIndex(o => o?.file?.id === id)
  if (idx >= 0) allFiles.value.splice(idx, 1)
  // 清理索引与缓存
  idToFile.delete(id); idToCtx.delete(id)
  try { delete scoreById[id] } catch {}
  try { delete quickTagsById[id] } catch {}
  try { delete annoCache[id] } catch {}
  // 若当前弹窗绑定的就是被删项，关闭弹窗
  if (rateVisible.value && rateTarget.value?.id === id) {
    rateVisible.value = false
  }
}
/* ====== 弹窗内删除：复用 deleteOne，删除完自动关闭弹窗 ====== */
const deleteFromDialog = async () => {
  if (!rateTarget.value) return
  await deleteOne(rateTarget.value)  // 已有的删除方法（你上条代码里有）
  // deleteOne 内部已经会在删除当前文件时把弹窗关闭，这里不需要额外处理
}

const deleteOne = async (file) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除该图片吗？\n文件名：${file.file_name}\n编号：${file.id}\n此操作不可撤销。`,
      '危险操作：删除图片',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch {
    return // 用户取消
  }


  try {
    deletingId.value = file.id
    const { code, message } = await apiJson('/assets/delete', {
      method: 'POST',
      body: JSON.stringify({ submission_ids: [Number(file.id)] }),
      timeout: 20000
    })
    if (code !== 0) throw new Error(message || '删除失败')
    removeFileById(file.id)
    ElMessage.success('图片已删除')
  } catch (e) {
    ElMessage.error('删除失败：' + (e?.message || e))
  } finally {
    deletingId.value = null
  }
}

/* 标签下载 */
const tagOptions = ref([])
const selectedTag = ref(null)
const loadingTag = ref(false)
const loadTags = async () => {
  try {
    const { code, data, message } = await apiJson('/tags')
    if (code !== 0) throw new Error(message || '接口错误')
    tagOptions.value = (data || []).filter(t => t.is_active)
    selectedTag.value = null
  } catch (e) { ElMessage.error('拉取标签失败：' + e.message) }
}
const handleRefreshTags = async () => {
  ElMessage.info('正在刷新标签 …')
  await loadTags()
  ElMessage.success('标签列表已刷新')
}
const downloadTagZip = async () => {
  if (!selectedTag.value) { 
    ElMessage.warning('请先选择标签'); 
    return 
  }
  loadingTag.value = true
  try {
    ElMessage({ message: '正在准备标签下载文件，请稍候...', type: 'loading', duration: 0 });
    const res = await fetch(`${API_BASE}/assets/tag_download`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: 'Bearer ' + TOKEN 
      },
      body: JSON.stringify({ tag: selectedTag.value }),
      cache: 'no-store',
      signal: AbortSignal.timeout(120000)
    })
    const ctype = res.headers.get('content-type') || ''
    if (ctype.includes('application/zip')) {
      const blob = await res.blob()
      const fname = `${selectedTag.value}_${Date.now()}.zip`
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fname
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 100)
    } else {
      const { code, data, message } = await res.json()
      if (code !== 0 || !data?.url) throw new Error(message || '后端未返回文件')
      window.open(data.url, '_blank')
    }
    ElMessage.success('开始下载 ZIP')
  } catch (e) {
    if (e.name === 'TimeoutError') {
      ElMessage.error('下载超时，该标签可能包含大量文件，请稍后再试')
    } else if (e.name === 'AbortError') {
      ElMessage.warning('下载已取消')
    } else {
      ElMessage.error('下载失败：' + e.message)
    }
  } finally {
    ElMessage.closeAll()
    loadingTag.value = false 
  }
}

// 按时间下载图片
const downloadByDate = async () => {
  if (!dateRange.value || dateRange.value.length < 2) {
    ElMessage.warning('请选择完整的日期范围');
    return;
  }
  loadingTime.value = true;
  try {
    const [startDate, endDate] = dateRange.value;
    ElMessage({ message: '正在准备按时间下载文件，请稍候...', type: 'loading', duration: 0 });
    
    // 构建请求参数
    const params = new URLSearchParams();
    params.append('date', startDate);
    
    // 添加路径筛选参数
    if (timeSelectedPath.value.length > 0) {
      params.append('path', JSON.stringify(timeSelectedPath.value));
    }
    
    // 调用按时间下载的接口
    const res = await fetch(`${API_BASE}/assets/daily?${params.toString()}`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: 'Bearer ' + TOKEN 
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(120000)
    });
    
    const ctype = res.headers.get('content-type') || '';
    if (ctype.includes('application/zip')) {
      const blob = await res.blob();
      const fname = `daily_${startDate}_${Date.now()}.zip`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } else {
      const { code, data, message } = await res.json();
      if (code !== 0 || !data?.url) throw new Error(message || '后端未返回文件');
      window.open(data.url, '_blank');
    }
    ElMessage.success('开始下载 ZIP');
  } catch (e) {
    if (e.name === 'TimeoutError') {
      ElMessage.error('下载超时，请稍后再试');
    } else if (e.name === 'AbortError') {
      ElMessage.warning('下载已取消');
    } else {
      ElMessage.error('下载失败：' + e.message);
    }
  } finally {
    ElMessage.closeAll();
    loadingTime.value = false;
  }
}

// 按时间下载的批量下载ZIP函数
const downloadBatchByTime = async () => {
  if (!timeFilteredFiles.value.length) {
    ElMessage.warning('请先选择日期范围和路径');
    return;
  }
  
  if (timeFilteredFiles.value.length > 50) {
    ElMessage({ message: `正在准备${timeFilteredFiles.value.length}个文件的下载，请稍候...`, type: 'info' });
  }
  if (timeFilteredFiles.value.length > 100) {
    ElMessage({ message: `检测到文件数量较多(${timeFilteredFiles.value.length}个)，将自动使用分批下载模式以确保下载成功`, type: 'info' });
    return downloadInBatches(timeFilteredFiles.value);
  }
  
  timeDownloadProgress.value = 0;
  timeDownloadingBatch.value = true;
  
  try {
    const ids = timeFilteredFiles.value.map(f => f.id);
    ElMessage({ message: '正在准备下载文件，请稍候...', type: 'loading', duration: 0 });
    
    const res = await fetch(`${API_BASE}/assets/batch_download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + TOKEN
      },
      body: JSON.stringify({ submission_ids: ids }),
      cache: 'no-store',
      signal: AbortSignal.timeout(timeFilteredFiles.value.length > 50 ? 300000 : 120000)
    });
    
    const ctype = res.headers.get('content-type') || '';
      
    if (res.body && res.headers.has('content-length')) {
      const contentLength = parseInt(res.headers.get('content-length') || '0');
      let downloaded = 0;
      const reader = res.body.getReader();
      const stream = new ReadableStream({
        start(controller) {
          let lastUpdateTime = 0;
          const updateProgress = (downloaded, contentLength) => {
            const now = performance.now();
            if (now - lastUpdateTime > 16) {
              timeDownloadProgress.value = Math.round((downloaded / contentLength) * 100);
              lastUpdateTime = now;
            }
          };
          function push() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                timeDownloadProgress.value = 100;
                return;
              }
              downloaded += value.byteLength;
              updateProgress(downloaded, contentLength);
              controller.enqueue(value);
              push();
            });
          }
          push();
        }
      });
      const blob = await new Response(stream).blob();
      const now = new Date();
      const dateTime = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      
      // 生成文件名，使用时间范围
      let timeRangeStr = '时间范围';
      if (dateRange.value.length === 2) {
        timeRangeStr = `${dateRange.value[0].replace(/-/g, '')}-${dateRange.value[1].replace(/-/g, '')}`;
      }
      
      // 添加路径信息
      let pathName = '';
      if (timeSelectedPath.value.length > 0) {
        if (timeSelectedPath.value.length === 1) {
          pathName = formatPath(timeSelectedPath.value[0]) + '_';
        } else {
          const paths = timeSelectedPath.value.map(p => asStrPath(p));
          let commonPrefix = [];
          let hasCommonPrefix = true;
          let level = 0;
          while (hasCommonPrefix) {
            const currentLevelValues = paths.map(p => p[level]).filter(v => v !== undefined);
            if (currentLevelValues.length === 0) break;
            const firstValue = currentLevelValues[0];
            hasCommonPrefix = currentLevelValues.every(v => v === firstValue);
            if (hasCommonPrefix) {
              commonPrefix.push(firstValue);
              level++;
            }
          }
          if (commonPrefix.length > 0) {
            pathName = commonPrefix.join(' / ') + '_';
          }
        }
      }
      
      const cleanPathName = pathName.replace(/[/\\:*?"<>|]/g, '_');
      const fname = `${cleanPathName}${timeRangeStr}_${dateTime}.zip`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fname;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      ElMessage.success('开始下载 ZIP');
    } else {
      const { code, data, message } = await res.json();
      if (code !== 0 || !data?.url) throw new Error(message || '后端未返回文件');
      window.open(data.url, '_blank');
      ElMessage.success('开始下载 ZIP');
    }
  } catch (e) {
    if (e.name === 'TimeoutError') {
      ElMessage.error('下载超时，请稍后再试');
    } else if (e.name === 'AbortError') {
      ElMessage.warning('下载已取消');
    } else {
      ElMessage.error('下载失败：' + e.message);
    }
  } finally {
    ElMessage.closeAll();
    timeDownloadingBatch.value = false;
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}



// 移除选择的路径
const removeTimePath = (idx) => {
  timeSelectedPath.value.splice(idx, 1)
  filterTimeFiles()
}

// 触发按时间下载的搜索
const triggerTimeSearch = () => {
  filterTimeFiles()
  timeGridPage.value = 1
}

// 重置路径选择
const resetTimePath = () => {
  timeSelectedPath.value = []
  filterTimeFiles()
}

// 筛选按时间下载的文件
const filterTimeFiles = () => {
  if (!dateRange.value || dateRange.value.length < 2) {
    timeFilteredFiles.value = [];
    console.log('请选择日期范围');
    return;
  }
  
  const startDate = dateRange.value[0];
  const endDate = dateRange.value[1];
  
  console.log(`开始筛选文件: 日期范围 [${startDate}, ${endDate}], 路径 ${JSON.stringify(timeSelectedPath.value)}`);
  console.log(`当前已加载的文件总数: ${allFiles.value.length}`);
  
  // 本地过滤逻辑 - 由于后端API限制，目前只能过滤已加载的文件
  let filtered = [...allFiles.value];
  
  // 按路径筛选
  if (timeSelectedPath.value.length > 0) {
    filtered = filtered.filter(({ task_context }) => {
      const pathStr = asStrPath(task_context);
      return timeSelectedPath.value.some(selectedPath => {
        return selectedPath.every(seg => pathStr.includes(seg));
      });
    });
    console.log(`路径筛选后文件数: ${filtered.length}`);
  }
  

  
  // 从文件名提取日期并进行筛选
  // 文件名格式：20251126_007998.jpg (日期部分：前8位数字)
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // 设置为当天结束时间
    
    filtered = filtered.filter(({ file }) => {
      if (!file?.file_name) return false;
      
      // 从文件名提取日期：匹配前8位数字
      const dateMatch = file.file_name.match(/^(\d{4})(\d{2})(\d{2})_/);
      if (!dateMatch) return false;
      
      const [, year, month, day] = dateMatch;
      const fileDate = new Date(`${year}-${month}-${day}`);
      
      // 检查日期是否在范围内
      return fileDate >= start && fileDate <= end;
    });
    
    console.log(`日期筛选后文件数: ${filtered.length}`);
  }
  
  // 搜索筛选
  if (timeKw.value.trim()) {
    const keyword = timeKw.value.trim().toLowerCase();
    filtered = filtered.filter(({ file }) => {
      if (timeSearchMode.value === 'name') {
        return file.file_name?.toLowerCase().includes(keyword);
      } else {
        return file.submission_id?.toLowerCase().includes(keyword);
      }
    });
  }

  const resultFiles = filtered.map(item => item.file);
  timeFilteredFiles.value = resultFiles;
  
  // 重置分页
  timeGridPage.value = 1;
  
  console.log(`最终筛选结果: ${resultFiles.length} 个文件`);
  
  // 如果没有找到文件，给出提示
  if (resultFiles.length === 0) {
    ElMessage.info('在已加载的素材中未找到匹配的文件。\n请尝试：\n1. 扩大日期范围\n2. 检查路径选择\n3. 修改搜索关键词');
  }
  
  timeGridPage.value = 1;
}

// 分页后的文件列表
const timePagedFiles = computed(() => {
  const start = (timeGridPage.value - 1) * timePageSize.value
  const end = start + timePageSize.value
  return timeFilteredFiles.value.slice(start, end)
})

// 监听图片URL变化控制预览弹窗
watch(previewImageUrl, (newVal) => {
  previewVisible.value = !!newVal
})

// 监听日期范围变化，自动筛选
watch(dateRange, () => {
  filterTimeFiles()
}, { deep: true })

// 监听路径选择变化，自动筛选
watch(timeSelectedPath, () => {
  filterTimeFiles()
}, { deep: true })

// 监听timePagedFiles变化，初始化相关状态
watch(timePagedFiles, () => {
  nextTick(() => {
    timePagedFiles.value.forEach(f => {
      if (!annoCache[f.id]) fetchAnnosForFile(f)
      if (scoreById[f.id] == null) scoreById[f.id] = Number(f.score ?? 80)
      if (!Array.isArray(quickTagsById[f.id])) quickTagsById[f.id] = Array.isArray(f.tags) ? f.tags.slice() : []
      // 确保只有在customNameById为空且f.custom_name有值时才设置
      if (customNameById[f.id] == null && f.custom_name) {
        customNameById[f.id] = f.custom_name.trim()
      }
    })
  })
})


/* 生命周期 */
onMounted(() => {
  load()
  loadTags()
})
watch(pagedFiltered, () => {
  nextTick(() => {
    pagedFiltered.value.forEach(f => {
      if (!annoCache[f.id]) fetchAnnosForFile(f)
      if (scoreById[f.id] == null) scoreById[f.id] = Number(f.score ?? 80)
      if (!Array.isArray(quickTagsById[f.id])) quickTagsById[f.id] = Array.isArray(f.tags) ? f.tags.slice() : []
      // 确保只有在customNameById为空且f.custom_name有值时才设置
      // 直接使用完整的custom_name，不再进行清理
      if (customNameById[f.id] == null && f.custom_name) {
        // 直接使用完整的custom_name，不进行任何清理或修改
        customNameById[f.id] = f.custom_name.trim()
      } // 所有情况都已处理完毕
    })
  })
}, { immediate: true })

const onWinResize = () => {}
window.addEventListener('resize', onWinResize)
onBeforeUnmount(() => {
  window.removeEventListener('resize', onWinResize)
  if (ro.value) ro.value.disconnect()
})

watch(activeTab, v => {
  if (v === 'scene' && cascaderOpts.value.length === 0) load()
  if (v === 'tag' && tagOptions.value.length === 0) loadTags()
})

// 子组件提交完成后刷新素材列表
const onSubmittedFromChild = async () => {
  try { await load() } catch {}
}

/* 展示辅助 */
const formatPath = p => (Array.isArray(p) ? p.join(' / ') : '')
const pathKey = p => (Array.isArray(p) ? p.join('>') : String(p))
const removePath = idx => selected.value.splice(idx, 1)

/* 已选路径 chip 配色 */
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
/* 内容与其它页对齐 */
.pane-body { margin-left: 290px; }

/* 搜索行 */
.search-line { display:flex; align-items:center; gap:8px; }

/* 胶囊 tabs */
.pill-tabs { margin-top:20px; --tabs-offset:290px;
  --tab-bg:#f6f8fb; --tab-hover-bg:#eef2f8; --tab-active-bg:#fff; --tab-active-ring:rgba(24,144,255,.15);
  --tab-text:#4a5568; --tab-text-active:#1890ff; --tab-border:#e8edf3;
}
.pill-tabs :deep(.el-tabs__header){ margin-left:var(--tabs-offset); background:var(--tab-bg); padding:12px 14px; border:1px solid var(--tab-border); border-radius:18px; margin-bottom:16px; width:fit-content; }
.pill-tabs :deep(.el-tabs__nav-wrap){ margin-bottom:0 !important; }
.pill-tabs :deep(.el-tabs__nav){ border:none !important; }
.pill-tabs :deep(.el-tabs__item){ margin:4px 8px; border-radius:999px; border:1px solid transparent; transition:all .18s ease; padding:8px 16px !important; font-size:15px; color:var(--tab-text); background:transparent; }
.pill-tabs :deep(.el-tabs__item:hover){ background:var(--tab-hover-bg); }
.pill-tabs :deep(.el-tabs__item.is-active){ color:var(--tab-text-active); background:var(--tab-active-bg); border-color:var(--tab-border); box-shadow:0 0 0 3px var(--tab-active-ring); }

/* 已选路径展示区 */
.selected-area {
  width: 960px;
  background: #f7f9fc;
  border: 2px dashed #c6d4e6;
  border-radius: 12px;
  padding: 12px 14px;
  min-height: 90px;
  box-sizing: border-box;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.6);
}
.selected-title { font-size: 13px; color: #6b778c; margin-bottom: 6px; }
.selected-empty { font-size: 13px; color: #9aa4b2; padding: 6px 2px 2px; }
.chips-wrap { display:flex; flex-wrap:wrap; gap:8px; max-height:120px; overflow:auto; }
.chip.path-chip{ border-radius: 999px; border:1px solid var(--chip-bd); padding: 4px 10px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 1px 2px rgba(0,0,0,.02), inset 0 -1px 0 rgba(255,255,255,.7); }
.chip .dot{ width:8px; height:8px; border-radius:999px; display:inline-block; }

/* 结果卡片 */
.grid-wrap { width: 960px; margin-top: 6px; }
.grid-col { margin-bottom: 18px; } 

/* 卡片布局 */
.asset-card.biz-look{
  border-radius: 14px;
  overflow: hidden;
  border:1px solid #e9eef5;
  background: linear-gradient(180deg,#ffffff,#fbfdff);
  transition: box-shadow .18s ease, transform .18s ease, border-color .18s ease;
}
.asset-card.biz-look:hover{
  box-shadow: 0 6px 24px rgba(28,39,56,.08), 0 2px 8px rgba(28,39,56,.05);
  border-color:#dbe7fd;
  transform: translateY(-1px);
}
.card-main { display:flex; gap:14px; padding:12px; align-items:flex-start; }
/* 缩略图比例控制 */
.thumb-wrap{
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  border-radius:10px;
  border:1px solid #eef2f6;
  background:#f5f7fa;
  overflow:hidden;
}
.thumb-wrap.four-three{ aspect-ratio: 4 / 3; }
/* 新增：手机常见比例 3:4，占位与图片一致，且整体略缩小 */
.thumb-wrap.phone-aspect{ aspect-ratio: 3 / 4; width: 150px; flex: 0 0 150px; }
.thumb-wrap img{
  width:100%;
  height:100%;
  object-fit: contain;
  display:block;
  image-orientation: from-image;
  background:#f5f7fa;
}

/* 右上角操作条 */
.card-actions { position: absolute; top: 8px; right: 8px; display: inline-flex; gap: 8px; background: rgba(255,255,255,0.9); border: 1px solid #e7ebf0; border-radius: 999px; padding: 4px 6px; backdrop-filter: blur(2px); }
.icon.action { cursor: pointer; font-size: 16px; color: #1f2d3d; transition: color .15s ease, opacity .15s ease; }
.icon.action:hover { color: #1890ff; }
.icon.action.danger { color: #b42318; }
.icon.action.danger:hover { color: #ef4444; }
.icon.action.disabled { opacity: .45; pointer-events: none; }

.file-name { padding: 0 12px 12px; font-size: 12px; color: #3b4150; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-name { padding-left: 32px; }

/* 右侧操作面板 */
.ops-wrap{
  width: 280px;
  border-left: 1px dashed #eef2f6;
  padding-left: 12px;
  display:flex;
  flex-direction: column;
  gap:12px;
}
.ops-title{ font-weight:600; color:#0f172a; font-size:13px; margin-top:2px; letter-spacing:.2px; }
.ops-label{ font-size:12px; color:#6b7280; margin-bottom:4px; }
.ops-field{ display:flex; align-items:center; gap:8px; }
.ops-field .num{ width:82px; }
.ops-buttons{ display:flex; gap:8px; margin-top:4px; }

.ops-annos{ display:flex; flex-direction:column; gap:6px; }
.anno-item{
  display:flex; align-items:center; gap:6px;
  font-size:12px; color:#374151;
  padding:6px 8px; border:1px solid #eef2f6; border-radius:10px; background:#fff;
}
.anno-item .idx{ font-weight:600; color:#2563eb; background:#eef2ff; padding:0 6px; border-radius:999px; }
.anno-item .coords{ color:#1f2937; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.anno-item .remark{ color:#6b7280; max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.anno-empty{ color:#9aa4b2; font-size:12px; }

.row{ margin-bottom: 10px; }
.btn-delete{border-radius: 999px; padding: 2px 10px;}
.btn-delete .btn-ic{ margin-left: -10px; width: 30px; }

/* 分页 */
.grid-pagination { width: 960px; display:flex; align-items:center; justify-content:center; gap:12px; margin: 12px 0 32px; }
.total-cn { color: #667085; font-size: 13px; }
.grid-pagination :deep(.el-pagination__jump){ font-size:0; }
.grid-pagination :deep(.el-pagination__jump)::before{ content:'跳至'; font-size:12px; color:#606266; margin-right:6px; }
.grid-pagination :deep(.el-pagination__jump)::after{ content:'页'; font-size:12px; color:#606266; margin-left:6px; }
.grid-pagination :deep(.el-pagination__editor.el-input){ font-size:12px; }
.grid-pagination :deep(.el-pagination__editor .el-input__inner){ height:26px; }

/* 组件底部兜底留白 */
.asset-download { padding-bottom: 32px; }

/* 标注弹窗 */
.rate-layout { display: grid; grid-template-columns: 1fr 420px; gap: 18px; }
.draw-stage { position: relative; width: 100%; max-width: 720px; border: 1px solid #e8edf3; border-radius: 12px; overflow: hidden; background: #f8fafc; cursor: crosshair; }
.draw-stage img { width: 100%; display: block; user-select: none; -webkit-user-drag: none; }

.draw-box { position: absolute; pointer-events: none; }
.draw-box.history { border: 2px dashed #ff9f43; background: rgba(255,159,67,.12); }
.draw-box.history.active { box-shadow: 0 0 0 2px rgba(255,159,67,.3); }
.draw-box.new { border: 2px solid #1890ff; background: rgba(24,144,255,.15); }
.draw-box.drafting { border: 2px solid #1890ff; background: rgba(24,144,255,.12); }

.box-badge{ position: absolute; left: 0; top: -6px; background: rgba(255,255,255,.92); border: 1px solid #e7ebf0; border-radius: 999px; padding: 1px 6px; font-size: 12px; color: #4a5568; white-space: nowrap; max-width: 70%; overflow: hidden; text-overflow:ellipsis; line-height: 16px; pointer-events: auto; }
.box-badge .tag{ display:inline-block; max-width:160px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }

.draw-toolbar { position: absolute; left: 8px; bottom: 8px; right: 8px; display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.94); border: 1px solid #e7ebf0; border-radius: 999px; padding: 6px 10px; pointer-events: auto; }
.pill-title{ border-radius:999px; }
.legend { display:inline-block; width: 24px; height: 10px; border-radius: 2px; margin-left: 4px; vertical-align: middle;}
.legend.history { background: rgba(255,159,67,.6); border: 1px dashed #ff9f43; }
.legend.new     { background: rgba(24,144,255,.5); border: 1px solid  #1890ff; }


/* 缩放 */

.canvas-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  will-change: transform;
}

.zoom-side{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
}

.zoom-ctrl {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 8px;
}
.zoom-text {
  min-width: 48px;
  text-align: center;
  font-size: 12px;
  color: #334155;
}
.zoom-hint{
  margin-left:4px;
  font-size:12px;
  color:#64748b;
  white-space:nowrap;
}
.kbd-tip {
  margin-left: 8px;
  color: #64748b;
}

/* 右侧表单（弹窗） */
.section-title{
  display:flex;
  align-items:center;
  gap:10px;
  margin:10px 0 12px;
  flex-wrap: nowrap;
}

/* 让两列在网格里按内容高度排布，别把左侧拉到和右侧一样高 */
.rate-layout { align-items: start; }

/* 明确指定左侧绘制区按内容高度，不参与拉伸 */
.draw-stage { align-self: start; }


.section-title.section-gap-lg{ margin-top: 20px; }
.section-title .bar{ width:8px; height:18px; border-radius:4px; background: linear-gradient(180deg,#60a5fa,#2563eb); box-shadow:0 1px 2px rgba(37,99,235,.25); }
.section-title .text{ font-weight:700; color:#0f172a; white-space: nowrap; }
.section-title .sub{
  color:#6b7280;
  font-size:12px;
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-grid{ display: grid; grid-template-columns: 1fr; gap: 12px; max-height: 560px; overflow: auto; padding-right: 4px; }
.history-card{ background:#fff; border:1px solid #eef2f6; border-radius:12px; overflow:hidden; box-shadow: 0 1px 2px rgba(0,0,0,.03); }
.history-card.active{ box-shadow: inset 3px 0 0 0 #2563eb; border-color:#dbe7fd; }
.card-head{ display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#f9fafb; border-bottom:1px solid #f1f5f9; cursor:pointer; }
.card-head .meta{ display:flex; gap:10px; align-items:center; font-size:12px; color:#374151; }
.card-head .chip-id{ background:#eef2ff; color:#3730a3; padding:2px 6px; border-radius:999px; font-weight:600; }
.card-head .chip-score{ color:#6b7280; }
.fold-icon{ transition: transform .2s ease; color:#6b7280; }
.fold-icon.open{ transform: rotate(180deg); }
.card-body{ padding:12px; }
.card-row{ display:flex; align-items:flex-start; gap:10px; margin-top:10px; }
.card-row .label.sm{ width:56px; color:#374151; line-height:32px; }
.card-row .field{ flex:1; }
.card-foot{ display:flex; justify-content:space-between; align-items:center; margin-top:10px; font-size:12px; color:#6b7280; }
.tip-row{ margin-top:8px; font-size:12px; color:#6b7280; }

.no-new { color:#9aa4b2; font-size: 13px; background:#f8fafc; border:1px dashed #e5e7eb; padding:10px 12px; border-radius:10px; }
.loading-mask{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,.6); font-size:13px; color:#4b5563; }

/* 批量下载进度条样式 */
.download-progress-container {
  margin-top: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  width: 960px;
  box-sizing: border-box;
}

.progress-text {
  margin-top: 8px;
  text-align: center;
  font-size: 14px;
  color: #606266;
}

.download-progress-container :deep(.el-progress-bar__outer) {
  border-radius: 10px;
  background-color: #e9ecef;
  height: 16px;
}

.download-progress-container :deep(.el-progress-bar__inner) {
  border-radius: 10px;
  background-color: #1890ff;
  transition: width 0.3s ease;
}

.download-progress-container :deep(.el-progress__text) {
  font-size: 12px;
  color: #ffffff;
  font-weight: 500;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

/* 图片提交相关样式 */
.image-submission-container {
  padding: 32px;
  background-color: #fff;
  border-radius: 4px;
}

.path-selection-section {
  margin-bottom: 24px;
}

.upload-section {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px dashed #e5e7eb;
}

.submit-btn {
  margin-left: auto;
}

.preview-section {
  margin-bottom: 24px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  min-height: 200px;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 4px;
}

.form-section {
  margin-top: 24px;
}

.annotations-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.annotation-item {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.annotation-type {
  width: 120px;
}

.annotation-remark {
  flex: 1;
}

/* 适配移动端 */
@media (max-width: 768px) {
  .image-submission-container {
    padding: 16px;
  }
  
  .path-selection-section {
    width: 100%;
  }
  
  .path-selection-section .el-cascader {
    width: 100% !important;
  }
  
  .upload-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .submit-btn {
    margin-left: 0;
    width: 100%;
  }
  
  .annotation-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .annotation-type {
    width: 100%;
  }
}
</style>
