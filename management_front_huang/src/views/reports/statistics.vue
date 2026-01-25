<template>
  <div class="statistics">
    <!-- 时间范围选择 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" :inline="true">
        <el-form-item label="统计周期">
          <el-radio-group v-model="filterForm.period" @change="handlePeriodChange">
            <el-radio-button label="day">日报表</el-radio-button>
            <el-radio-button label="week">周报表</el-radio-button>
            <el-radio-button label="month">月报表</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            :type="datePickerType"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="generateReport">
            <el-icon><DataAnalysis /></el-icon>
            生成报表
          </el-button>
          <el-button @click="exportReport">
            <el-icon><Download /></el-icon>
            导出Excel
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计概览 -->
    <el-row :gutter="20" class="overview-cards">
      <el-col :span="6" v-for="item in overviewData" :key="item.title">
        <el-card class="overview-card">
          <div class="overview-content">
            <div class="overview-icon" :style="{ backgroundColor: item.color }">
              <el-icon size="24"><component :is="item.icon" /></el-icon>
            </div>
            <div class="overview-info">
              <div class="overview-value">{{ item.value }}</div>
              <div class="overview-title">{{ item.title }}</div>
              <div class="overview-trend" :class="item.trend > 0 ? 'up' : 'down'">
                <el-icon><component :is="item.trend > 0 ? 'TrendCharts' : 'Bottom'" /></el-icon>
                {{ Math.abs(item.trend) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-section">
      <el-col :span="12">
        <el-card title="工单趋势分析">
          <template #header>
            <span>工单趋势分析</span>
          </template>
          <v-chart :option="trendChartOption" style="height: 350px;" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="工单状态分布">
          <template #header>
            <span>工单状态分布</span>
          </template>
          <v-chart :option="statusChartOption" style="height: 350px;" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-section">
      <el-col :span="12">
        <el-card title="优先级分布">
          <template #header>
            <span>优先级分布</span>
          </template>
          <v-chart :option="priorityChartOption" style="height: 350px;" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="处理时长分析">
          <template #header>
            <span>处理时长分析</span>
          </template>
          <v-chart :option="durationChartOption" style="height: 350px;" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card class="table-card">
      <template #header>
        <span>详细统计数据</span>
      </template>
      <el-table :data="statisticsData" stripe>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="newTickets" label="新增工单" width="100" />
        <el-table-column prop="completedTickets" label="完成工单" width="100" />
        <el-table-column prop="pendingTickets" label="待处理" width="100" />
        <el-table-column prop="avgDuration" label="平均处理时长(小时)" width="150" />
        <el-table-column prop="completionRate" label="完成率" width="100">
          <template #default="{ row }">
            {{ row.completionRate }}%
          </template>
        </el-table-column>
        <el-table-column prop="satisfactionRate" label="满意度" width="100">
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
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import * as XLSX from 'xlsx'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const filterForm = reactive({
  period: 'day',
  dateRange: []
})

const datePickerType = computed(() => {
  const types = {
    day: 'daterange',
    week: 'week',
    month: 'monthrange'
  }
  return types[filterForm.period]
})

const overviewData = ref([
  {
    title: '总工单数',
    value: '1,234',
    icon: 'Tickets',
    color: '#409EFF',
    trend: 12.5
  },
  {
    title: '完成率',
    value: '89.2%',
    icon: 'CircleCheck',
    color: '#67C23A',
    trend: 5.3
  },
  {
    title: '平均处理时长',
    value: '4.2h',
    icon: 'Timer',
    color: '#E6A23C',
    trend: -8.1
  },
  {
    title: '客户满意度',
    value: '4.6',
    icon: 'Star',
    color: '#F56C6C',
    trend: 2.7
  }
])

const statisticsData = ref([])
const trendChartOption = ref({})
const statusChartOption = ref({})
const priorityChartOption = ref({})
const durationChartOption = ref({})

// 模拟统计数据
const mockStatisticsData = [
  {
    date: '2024-01-15',
    newTickets: 23,
    completedTickets: 18,
    pendingTickets: 5,
    avgDuration: 4.2,
    completionRate: 78.3,
    satisfactionRate: 4.5
  },
  {
    date: '2024-01-14',
    newTickets: 19,
    completedTickets: 22,
    pendingTickets: 3,
    avgDuration: 3.8,
    completionRate: 84.6,
    satisfactionRate: 4.7
  },
  {
    date: '2024-01-13',
    newTickets: 31,
    completedTickets: 25,
    pendingTickets: 8,
    avgDuration: 5.1,
    completionRate: 80.6,
    satisfactionRate: 4.3
  }
]

const initCharts = () => {
  // 趋势图
  trendChartOption.value = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['新增工单', '完成工单']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['01-13', '01-14', '01-15', '01-16', '01-17', '01-18', '01-19']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新增工单',
        type: 'line',
        data: [31, 19, 23, 28, 15, 22, 18],
        smooth: true
      },
      {
        name: '完成工单',
        type: 'line',
        data: [25, 22, 18, 24, 20, 19, 21],
        smooth: true
      }
    ]
  }

  // 状态分布饼图
  statusChartOption.value = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '工单状态',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: '已完成' },
          { value: 735, name: '处理中' },
          { value: 580, name: '待分配' },
          { value: 484, name: '已关闭' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  // 优先级分布柱状图
  priorityChartOption.value = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['低', '中', '高', '紧急']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '工单数量',
        type: 'bar',
        data: [120, 200, 150, 80],
        itemStyle: {
          color: function(params) {
            const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666']
            return colors[params.dataIndex]
          }
        }
      }
    ]
  }

  // 处理时长分析
  durationChartOption.value = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['<2h', '2-4h', '4-8h', '8-16h', '>16h']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '工单数量',
        type: 'bar',
        data: [45, 120, 180, 90, 25],
        itemStyle: {
          color: '#73c0de'
        }
      }
    ]
  }
}

const handlePeriodChange = () => {
  filterForm.dateRange = []
}

const handleDateChange = () => {
  generateReport()
}

const generateReport = () => {
  ElMessage.success('报表生成成功')
  statisticsData.value = mockStatisticsData
  initCharts()
}

const exportReport = () => {
  try {
    const ws = XLSX.utils.json_to_sheet(statisticsData.value)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '统计报表')
    
    const fileName = `工单统计报表_${filterForm.period}_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    ElMessage.success('报表导出成功')
  } catch (error) {
    ElMessage.error('导出失败，请重试')
  }
}

onMounted(() => {
  // 设置默认时间范围
  const today = new Date()
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  filterForm.dateRange = [
    lastWeek.toISOString().split('T')[0],
    today.toISOString().split('T')[0]
  ]
  
  generateReport()
})
</script>

<style scoped>
.statistics {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.overview-cards {
  margin-bottom: 20px;
}

.overview-card {
  height: 120px;
}

.overview-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.overview-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 20px;
}

.overview-info {
  flex: 1;
}

.overview-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.overview-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.overview-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.overview-trend.up {
  color: #67C23A;
}

.overview-trend.down {
  color: #F56C6C;
}

.charts-section {
  margin-bottom: 20px;
}

.table-card {
  margin-top: 20px;
}
</style>