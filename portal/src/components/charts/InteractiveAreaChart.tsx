"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { format, parseISO, isValid } from 'date-fns'

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
    payin: {
        label: "Payin",
        color: "hsl(var(--chart-1))",
    },
    payout: {
        label: "Payout",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig

interface InteractiveAreaChartProps {
    data: any[];
    period?: string;
    onPeriodChange?: (period: string) => void;
    merchants?: any[];
    merchantId?: string;
    onMerchantChange?: (id: string) => void;
    startDate?: string;
    endDate?: string;
}

export function InteractiveAreaChart({
    data,
    period = "Last 90 days",
    onPeriodChange,
    merchants = [],
    merchantId = "all",
    onMerchantChange,
    startDate,
    endDate
}: InteractiveAreaChartProps) {
    // Map full string to short code for Select value
    const getPeriodValue = (p: string) => {
        if (p === "Last 7 days") return "7d"
        if (p === "Last 30 days") return "30d"
        if (p === "Last 90 days") return "90d"
        if (p === "Custom") return "custom"
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
            if (value === "custom") newPeriod = "Custom"
            onPeriodChange(newPeriod)
        }
    }

    const formatRange = () => {
        if (timeRange === "custom" && startDate && endDate) {
            try {
                const start = parseISO(startDate);
                const end = parseISO(endDate);
                if (isValid(start) && isValid(end)) {
                    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
                }
            } catch (e) {
                return period;
            }
        }
        return period || "Showing total Payin & Payout Volume";
    };

    return (
        <Card>
            <CardHeader className="flex flex-col items-start gap-4 space-y-0 border-b py-5 sm:flex-row sm:items-center">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Payin & Payout Volume</CardTitle>
                    <CardDescription>
                        {formatRange()}
                    </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:ml-auto">
                    {/* Merchant Filter */}
                    {merchants.length > 0 && (
                        <Select value={merchantId} onValueChange={onMerchantChange}>
                            <SelectTrigger
                                className="w-[180px] rounded-lg"
                                aria-label="Select merchant"
                            >
                                <SelectValue placeholder="All Merchants" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all" className="rounded-lg">
                                    All Merchants
                                </SelectItem>
                                {merchants.map((merchant: any) => (
                                    <SelectItem
                                        key={merchant.id}
                                        value={merchant.id}
                                        className="rounded-lg"
                                    >
                                        {merchant.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}



                    {/* Period Filter */}
                    <Select value={timeRange} onValueChange={handleRangeChange}>
                        <SelectTrigger
                            className="w-[160px] rounded-lg"
                            aria-label="Select period"
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
                            <SelectItem value="custom" className="rounded-lg">
                                Custom Range
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="fillPayin" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-payin)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-payin)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                            <linearGradient id="fillPayout" x1="0" y1="0" x2="0" y2="1">
                                <stop
                                    offset="5%"
                                    stopColor="var(--color-payout)"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="var(--color-payout)"
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
                            dataKey="payout"
                            type="monotone"
                            fill="url(#fillPayout)"
                            stroke="var(--color-payout)"
                            stackId="a"
                        />
                        <Area
                            yAxisId="left"
                            dataKey="payin"
                            type="monotone"
                            fill="url(#fillPayin)"
                            stroke="var(--color-payin)"
                            stackId="a"
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
