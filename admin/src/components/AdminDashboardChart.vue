<template>
  <div class="h-[350px] w-full bg-card rounded-xl border p-6 shadow-sm flex flex-col">
    <div class="mb-4 flex-none" v-if="title">
      <h3 class="text-base font-semibold text-card-foreground">{{ title }}</h3>
      <p v-if="subtitle" class="text-sm text-muted-foreground">{{ subtitle }}</p>
    </div>
    <div class="flex-1 w-full min-h-0 relative">
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-card/50 z-10">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
      <div v-else class="absolute inset-0">
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
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  data: {
    type: Object,
    default: () => ({ categories: [], series: [] })
  },
  loading: {
    type: Boolean,
    default: false
  }
})

// Transform props.data into Array of Objects for Frappe UI AxisChart
// Input format: { categories: ['2023-01-01', ...], series: [{ name: 'Revenue', data: [100, ...] }, ...] }
// Output format: [{ date: '2023-01-01', Revenue: 100 }, ...]
const processedData = computed(() => {
  if (!props.data || !props.data.categories || !props.data.categories.length) {
    return []
  }
  
  return props.data.categories.map((date, index) => {
    const row = { date }
    props.data.series.forEach(s => {
      row[s.name] = s.data[index] || 0
    })
    return row
  })
})

const seriesConfig = computed(() => {
    if (!props.data || !props.data.series) return []
    
    // Define colors and prefixes based on series name
    return props.data.series.map(s => {
        let color = '#3b82f6' // Default blue
        let prefix = ''
        
        if (s.name === 'Revenue') {
            color = '#10b981' // Green
            prefix = '₹'
        } else if (s.name === 'Orders') {
            color = '#8b5cf6' // Purple
        }
        
        return {
            name: s.name,
            color,
            prefix
        }
    })
})

const chartConfig = computed(() => {
  return {
    data: processedData.value,
    title: '', 
    colors: seriesConfig.value.map(s => s.color),
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
          color: 'var(--muted-foreground, #64748b)'
        }
      }
    },
    yAxis: {
      title: '', 
      echartOptions: {
        name: '', 
        nameLocation: 'end',
        nameGap: 0,
        nameTextStyle: { show: false },
        splitLine: { show: false },
        axisLabel: {
          fontSize: 11,
          color: 'var(--muted-foreground, #64748b)',
          formatter: (value) => {
            if (value >= 1000) return `${(value/1000).toFixed(0)}k`
            return value
          }
        },
        min: 0,
        max: (value) => value.max === 0 ? 10 : undefined
      }
    },
    stacked: true,
    series: seriesConfig.value.map(s => ({
      name: s.name,
      type: 'area',
      color: s.color,
      fillOpacity: 0.6,
      echartOptions: {
        showSymbol: false,
        smooth: true,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.6 }
      }
    })),
    echartOptions: {
      title: { show: false },
      grid: {
        top: 20,
        bottom: 30,
        left: 50,
        right: 20,
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'var(--background, #ffffff)',
        borderColor: 'var(--border, #e2e8f0)',
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: 'var(--foreground, #0f172a)',
          fontSize: 12
        },
        formatter: (params) => {
          if (!params || !params.length) return ''
          const label = params[0].name
          let html = `<div class="font-medium mb-2">${label}</div>`
          
          params.forEach(item => {
            const value = item.value[1]
            const sConf = seriesConfig.value.find(s => s.name === item.seriesName)
            const prefix = sConf?.prefix || ''
            
            html += `
              <div class="flex items-center justify-between gap-4 mb-1">
                <div class="flex items-center gap-2">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color}"></span>
                  <span style="color:var(--muted-foreground)">${item.seriesName}:</span>
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
          color: 'var(--foreground, #0f172a)'
        }
      }
    }
  }
})
</script>
