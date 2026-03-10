<template>
  <div class="h-[350px] w-full bg-card rounded-xl border p-6 shadow-sm flex flex-col">
    <div class="mb-4 flex-none">
      <h3 class="text-base font-semibold text-card-foreground">{{ title }}</h3>
      <p v-if="subtitle" class="text-sm text-muted-foreground">{{ subtitle }}</p>
    </div>
    <div class="flex-1 w-full min-h-0 relative">
      <div class="absolute inset-0">
        <AxisChart :config="chartConfig" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { AxisChart } from 'frappe-ui'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  data: {
    type: Array,
    default: () => []
  },
  labels: {
    type: Array,
    default: () => []
  },
  series: {
    type: Array,
    required: true,
    // Format: [{ name: 'Revenue', key: 'revenue', color: '#10b981' }, ...]
  }
})

// Transform props.data (multiple series) and props.labels into Array of Objects
// Format: [{ date: 'Label', Revenue: 123, Orders: 45 }]
// Note: Series names must match the keys in the data objects
const processedData = computed(() => {
  console.log('DashboardAreaChart - Raw Props:', {
    labels: props.labels,
    data: props.data,
    series: props.series
  })
  
  // Validate inputs
  if (!props.labels || props.labels.length === 0) {
    console.warn('DashboardAreaChart - No labels provided')
    return []
  }
  
  if (!props.data || props.data.length === 0) {
    console.warn('DashboardAreaChart - No data provided')
    return []
  }
  
  if (!props.series || props.series.length === 0) {
    console.warn('DashboardAreaChart - No series provided')
    return []
  }
  
  const result = props.labels.map((label, index) => {
    const row = { date: label }
    const dataPoint = props.data[index] || {}
    
    props.series.forEach(s => {
      // Use the series name as the key (must match what AxisChart expects)
      const value = dataPoint[s.key]
      row[s.name] = (value !== undefined && value !== null) ? Number(value) : 0
    })
    return row
  })
  
  console.log('DashboardAreaChart - Processed Data:', result)
  return result
})

const chartConfig = computed(() => {
  return {
    data: processedData.value,
    title: '', 
    colors: props.series.map(s => s.color),
    xAxis: {
      key: 'date',
      type: 'category',
      echartOptions: {
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          interval: 'auto',
          fontSize: 11,
          color: '#64748b'
        }
      }
    },
    yAxis: {
      title: '', // Explicitly set to empty to prevent "undefined"
      echartOptions: {
        name: '', // Remove y-axis name
        nameLocation: 'end',
        nameGap: 0,
        nameTextStyle: {
          show: false
        },
        splitLine: { 
          show: false // Removed horizontal grid lines
        },
        axisLabel: {
          fontSize: 11,
          color: '#64748b',
          formatter: (value) => {
            if (value >= 1000) return `${(value/1000).toFixed(0)}k`
            return value
          }
        },
        // Ensure y-axis shows even with zero data
        min: 0,
        max: (value) => {
          // If all data is zero, set a reasonable max
          return value.max === 0 ? 10 : undefined
        }
      }
    },
    stacked: true,
    series: props.series.map(s => ({
      name: s.name,
      type: 'area',
      color: s.color,
      fillOpacity: 0.6,
      echartOptions: {
        showSymbol: false,
        smooth: true,
        lineStyle: {
          width: 2
        },
        areaStyle: {
          opacity: 0.6
        }
      }
    })),
    echartOptions: {
      title: {
        show: false
      },
      graphic: [],
      grid: {
        top: 20,
        bottom: 30,
        left: 50,
        right: 20,
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: '#0f172a',
          fontSize: 12
        },
        formatter: (params) => {
          if (!params || !params.length) return ''
          const label = params[0].name
          let html = `<div class="font-medium mb-2">${label}</div>`
          
          params.forEach(item => {
            const value = item.value[1]
            const seriesInfo = props.series.find(s => s.name === item.seriesName)
            const prefix = seriesInfo?.prefix || ''
            
            html += `
              <div class="flex items-center justify-between gap-4 mb-1">
                <div class="flex items-center gap-2">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color}"></span>
                  <span class="text-slate-600">${item.seriesName}:</span>
                </div>
                <span class="font-semibold">${prefix}${parseFloat(value || 0).toLocaleString('en-IN')}</span>
              </div>
            `
          })
          
          return html
        }
      },
      legend: {
        show: true,
        bottom: 0,
        itemGap: 20,
        textStyle: {
          fontSize: 12,
          color: '#64748b'
        }
      }
    }
  }
})
</script>
