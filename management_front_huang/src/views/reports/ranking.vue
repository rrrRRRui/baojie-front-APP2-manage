<template>
  <div class="ranking">
    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" :inline="true">
        <el-form-item label="排行类型">
          <el-select v-model="filterForm.rankType" @change="handleRankTypeChange">
            <el-option label="处理人员排行" value="staff" />
            <el-option label="部门排行" value="department" />
            <el-option label="工单类型排行" value="ticketType" />
            <el-option label="客户满意度排行" value="satisfaction" />
          </el-select>
        </el-form-item>
        <el-form-item label="统计周期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            format="YYYY-MM"
            value-format="YYYY-MM"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRankingData">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="exportRanking">
            <el-icon><Download /></el-icon>
            导出排行榜
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20">
      <!-- 排行榜图表 -->
      <el-col :span="14">
        <el-card class="chart-card">
          <template #header>
            <span>{{ getRankTitle() }}</span>
          </template>
          <v-chart :option="rankingChartOption" style="height: 500px;" />
        </el-card>
      </el-col>

      <!-- 排行榜列表 -->
      <el-col :span="10">
        <el-card class="ranking-list-card">
          <template #header>
            <span>排行榜 TOP 10</span>
          </template>
          <div class="ranking-list">
            <div
              v-for="(item, index) in rankingData.slice(0, 10)"
              :key="item.name"
              class="ranking-item"
              :class="getRankClass(index)"
            >
              <div class="rank-number">
                <el-icon v-if="index < 3" size="20">
                  <component :is="getRankIcon(index)" />
                </el-icon>
                <span v-else class="rank-text">{{ index + 1 }}</span>
              </div>
              <div class="rank-info">
                <div class="rank-name">{{ item.name }}</div>
                <div class="rank-value">{{ formatRankValue(item.value) }}</div>
              </div>
              <div class="rank-progress">
                <el-progress
                  :percentage="getProgressPercentage(item.value)"
                  :stroke-width="6"
                  :show-text="false"
                  :color="getProgressColor(index)"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card class="table-card">
      <template #header>
        <span>详细排行数据</span>
      </template>
      <el-table :data="rankingData" stripe>
        <el-table-column label="排名" width="80">
          <template #default="{ $index }">
            <div class="table-rank">
              <el-icon v-if="$index < 3" :style="{ color: getRankColor($index) }">
                <component :is="getRankIcon($index)" />
              </el-icon>
              <span v-else>{{ $index + 1 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" :label="getNameLabel()" min-width="150" />
        <el-table-column prop="value" :label="getValueLabel()" width="120">
          <template #default="{ row }">
            {{ formatRankValue(row.value) }}
          </template>
        </el-table-column>
        <el-table-column prop="completedTickets" label="完成工单数" width="120" />
        <el-table-column prop="avgDuration" label="平均处理时长" width="120">
          <template #default="{ row }">
            {{ row.avgDuration }}小时
          </template>
        </el-table-column>
        <el-table-column prop="satisfactionRate" label="满意度评分" width="120">
          <template #default="{ row }">
            <el-rate
              v-model="row.satisfactionRate"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value}"
            />
          </template>
        </el-table-column>
        <el-table-column label="趋势" width="100">
          <template #default="{ row }">
            <div class="trend-indicator" :class="row.trend > 0 ? 'up' : 'down'">
              <el-icon><component :is="row.trend > 0 ? 'TrendCharts' : 'Bottom'" /></el-icon>
              {{ Math.abs(row.trend) }}%
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import * as XLSX from 'xlsx'

use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const filterForm = reactive({
  rankType: 'staff',
  dateRange: []
})

const rankingData = ref([])
const rankingChartOption = ref({})

// 模拟排行数据
const mockRankingData = {
  staff: [
    { name: '张三', value: 156, completedTickets: 156, avgDuration: 3.2, satisfactionRate: 4.8, trend: 12.5 },
    { name: '李四', value: 142, completedTickets: 142, avgDuration: 3.8, satisfactionRate: 4.6, trend: 8.3 },
    { name: '王五', value: 138, completedTickets: 138, avgDuration: 4.1, satisfactionRate: 4.7, trend: -2.1 },
    { name: '赵六', value: 125, completedTickets: 125, avgDuration: 3.5, satisfactionRate: 4.5, trend: 15.2 },
    { name: '钱七', value: 118, completedTickets: 118, avgDuration: 4.3, satisfactionRate: 4.4, trend: 5.7 }
  ],
  department: [
    { name: '技术部', value: 456, completedTickets: 456, avgDuration: 3.6, satisfactionRate: 4.7, trend: 10.2 },
    { name: '运维部', value: 342, completedTickets: 342, avgDuration: 2.8, satisfactionRate: 4.8, trend: 8.5 },
    { name: '产品部', value: 298, completedTickets: 298, avgDuration: 4.2, satisfactionRate: 4.5, trend: -3.2 },
    { name: '测试部', value: 256, completedTickets: 256, avgDuration: 3.9, satisfactionRate: 4.6, trend: 12.8 }
  ],
  ticketType: [
    { name: '系统故障', value: 234, completedTickets: 234, avgDuration: 5.2, satisfactionRate: 4.3, trend: -5.6 },
    { name: '功能需求', value: 189, completedTickets: 189, avgDuration: 8.5, satisfactionRate: 4.6, trend: 18.2 },
    { name: '数据问题', value: 156, completedTickets: 156, avgDuration: 3.1, satisfactionRate: 4.7, trend: 7.3 },
    { name: '权限申请', value: 98, completedTickets: 98, avgDuration: 1.5, satisfactionRate: 4.8, trend: 22.1 }
  ],
  satisfaction: [
    { name: '张三', value: 4.8, completedTickets: 156, avgDuration: 3.2, satisfactionRate: 4.8, trend: 2.1 },
    { name: '运维部', value: 4.8, completedTickets: 342, avgDuration: 2.8, satisfactionRate: 4.8, trend: 1.5 },
    { name: '权限申请', value: 4.8, completedTickets: 98, avgDuration: 1.5, satisfactionRate: 4.8, trend: 0.8 },
    { name: '王五', value: 4.7, completedTickets: 138, avgDuration: 4.1, satisfactionRate: 4.7, trend: -0.3 }
  ]
}

const getRankTitle = () => {
  const titles = {
    staff: '处理人员工单完成数排行',
    department: '部门工单完成数排行',
    ticketType: '工单类型数量排行',
    satisfaction: '客户满意度排行'
  }
  return titles[filterForm.rankType]
}

const getNameLabel = () => {
  const labels = {
    staff: '处理人员',
    department: '部门',
    ticketType: '工单类型',
    satisfaction: '排行对象'
  }
  return labels[filterForm.rankType]
}

const getValueLabel = () => {
  const labels = {
    staff: '完成数量',
    department: '完成数量',
    ticketType: '工单数量',
    satisfaction: '满意度评分'
  }
  return labels[filterForm.rankType]
}

const formatRankValue = (value) => {
  if (filterForm.rankType === 'satisfaction') {
    return value.toFixed(1)
  }
  return value.toString()
}

const getRankClass = (index) => {
  if (index === 0) return 'rank-first'
  if (index === 1) return 'rank-second'
  if (index === 2) return 'rank-third'
  return ''
}

const getRankIcon = (index) => {
  const icons = ['Trophy', 'Medal', 'Award']
  return icons[index]
}

const getRankColor = (index) => {
  const colors = ['#FFD700', '#C0C0C0', '#CD7F32']
  return colors[index]
}

const getProgressPercentage = (value) => {
  if (rankingData.value.length === 0) return 0
  const maxValue = Math.max(...rankingData.value.map(item => item.value))
  return Math.round((value / maxValue) * 100)
}

const getProgressColor = (index) => {
  if (index === 0) return '#FFD700'
  if (index === 1) return '#C0C0C0'
  if (index === 2) return '#CD7F32'
  return '#409EFF'
}

const initChart = () => {
  const data = rankingData.value.slice(0, 10)
  
  rankingChartOption.value = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.name).reverse(),
      axisLabel: {
        interval: 0
      }
    },
    series: [
      {
        name: getValueLabel(),
        type: 'bar',
        data: data.map(item => item.value).reverse(),
        itemStyle: {
          color: function(params) {
            const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
            return colors[params.dataIndex % colors.length]
          }
        },
        label: {
          show: true,
          position: 'right',
          formatter: '{c}'
        }
      }
    ]
  }
}

const handleRankTypeChange = () => {
  loadRankingData()
}

const loadRankingData = () => {
  rankingData.value = mockRankingData[filterForm.rankType] || []
  initChart()
  ElMessage.success('排行数据加载成功')
}

const exportRanking = () => {
  try {
    const exportData = rankingData.value.map((item, index) => ({
      排名: index + 1,
      [getNameLabel()]: item.name,
      [getValueLabel()]: formatRankValue(item.value),
      完成工单数: item.completedTickets,
      平均处理时长: `${item.avgDuration}小时`,
      满意度评分: item.satisfactionRate,
      趋势: `${item.trend > 0 ? '+' : ''}${item.trend}%`
    }))
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '排行榜')
    
    const fileName = `${getRankTitle()}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    ElMessage.success('排行榜导出成功')
  } catch (error) {
    ElMessage.error('导出失败，请重试')
  }
}

onMounted(() => {
  // 设置默认时间范围
  const today = new Date()
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  filterForm.dateRange = [
    `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`,
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  ]
  
  loadRankingData()
})
</script>

<style scoped>
.ranking {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.chart-card {
  height: 600px;
}

.ranking-list-card {
  height: 600px;
}

.ranking-list {
  max-height: 500px;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank-number {
  width: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.rank-text {
  font-weight: bold;
  font-size: 16px;
}

.rank-first .rank-number {
  color: #FFD700;
}

.rank-second .rank-number {
  color: #C0C0C0;
}

.rank-third .rank-number {
  color: #CD7F32;
}

.rank-info {
  flex: 1;
  margin-left: 12px;
}

.rank-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.rank-value {
  font-size: 14px;
  color: #666;
}

.rank-progress {
  width: 80px;
  margin-left: 12px;
}

.table-card {
  margin-top: 20px;
}

.table-rank {
  display: flex;
  align-items: center;
  justify-content: center;
}

.trend-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.trend-indicator.up {
  color: #67C23A;
}

.trend-indicator.down {
  color: #F56C6C;
}
</style>