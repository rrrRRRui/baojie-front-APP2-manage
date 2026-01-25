<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon size="24"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card title="工单趋势">
          <template #header>
            <span>工单趋势</span>
          </template>
          <div class="chart-container">
            <v-chart :option="lineChartOption" style="height: 300px;" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card title="工单状态分布">
          <template #header>
            <span>工单状态分布</span>
          </template>
          <div class="chart-container">
            <v-chart :option="pieChartOption" style="height: 300px;" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const stats = ref([
  {
    title: '总工单数',
    value: '1,234',
    icon: 'Tickets',
    color: '#409EFF'
  },
  {
    title: '待处理',
    value: '56',
    icon: 'Clock',
    color: '#E6A23C'
  },
  {
    title: '已完成',
    value: '1,178',
    icon: 'Check',
    color: '#67C23A'
  },
  {
    title: '今日新增',
    value: '23',
    icon: 'Plus',
    color: '#F56C6C'
  }
])

const lineChartOption = ref({
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
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '新增工单',
      type: 'line',
      data: [12, 19, 3, 5, 2, 3, 8]
    },
    {
      name: '完成工单',
      type: 'line',
      data: [8, 15, 7, 12, 8, 6, 10]
    }
  ]
})

const pieChartOption = ref({
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
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-title {
  font-size: 14px;
  color: #909399;
}

.charts-row {
  margin-top: 20px;
}

.chart-container {
  padding: 20px 0;
}
</style>