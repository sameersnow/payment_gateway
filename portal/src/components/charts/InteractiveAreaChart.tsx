"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/Chart"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select"

export const description = "An interactive area chart"

const chartConfig = {
    revenue: {
        label: "Revenue",
        color: "hsl(var(--chart-1))",
    },
    orders: {
        label: "Orders",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig

interface InteractiveAreaChartProps {
    data: any[];
    period?: string;
    onPeriodChange?: (period: string) => void;
}

export function InteractiveAreaChart({ data, period = "Last 90 days", onPeriodChange }: InteractiveAreaChartProps) {
    // Map full string to short code for Select value
    const getPeriodValue = (p: string) => {
        if (p === "Last 7 days") return "7d"
        if (p === "Last 30 days") return "30d"
        if (p === "Last 90 days") return "90d"
        return "90d"
    }

    const [timeRange, setTimeRange] = React.useState(getPeriodValue(period))

    // Update internal state when prop changes
    React.useEffect(() => {
        setTimeRange(getPeriodValue(period))
    }, [period])

    const handleRangeChange = (value: string) => {
        setTimeRange(value)
        if (onPeriodChange) {
            let newPeriod = "Last 90 days"
            if (value === "7d") newPeriod = "Last 7 days"
            if (value === "30d") newPeriod = "Last 30 days"
            onPeriodChange(newPeriod)
        }
    }

    return (
        <Card>
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Revenue & Orders</CardTitle>
                    <CardDescription>
                        {period ? period : "Showing total revenue and orders"}
                    </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={handleRangeChange}>
                    <SelectTrigger
                        className="w-[160px] rounded-lg sm:ml-auto"
                        aria-label="Select a value"
                    >
                        <SelectValue placeholder="Last 3 months" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="90d" className="rounded-lg">
                            Last 3 months
                        </SelectItem>
                        <SelectItem value="30d" className="rounded-lg">
                            Last 30 days
                        </SelectItem>
                        <SelectItem value="7d" className="rounded-lg">
                            Last 7 days
                        </SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-revenue)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-revenue)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-orders)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-orders)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                // Handle if value is already formatted or partial date
                                // The API returns YYYY-MM-DD or similar.
                                if (isNaN(date.getTime())) return value
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        {/* Using left axis for Revenue */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tickLine={false}
                            axisLine={false}
                            hide
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            tickLine={false}
                            axisLine={false}
                            hide
                        />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })
                                    }}
                                    indicator="dot"
                                />
                            }
                        />
                        <Area
                            yAxisId="right"
                            dataKey="orders"
                            type="monotone"
                            fill="url(#fillOrders)"
                            stroke="var(--color-orders)"
                            stackId="a"
                        />
                        <Area
                            yAxisId="left"
                            dataKey="revenue"
                            type="monotone"
                            fill="url(#fillRevenue)"
                            stroke="var(--color-revenue)"
                            stackId="a"
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
