"use client"

import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/Card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/Chart"
import { formatCurrency } from "@/utils/formatters"

export const description = "A simple area chart"

const chartConfig = {
    revenue: {
        label: "Revenue",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig

interface RevenueAreaChartProps {
    data: Array<{ date: string; revenue: number }>;
}

export function RevenueAreaChart({ data }: RevenueAreaChartProps) {
    // Calculate trend
    // Calculate trend using split-half method (comparing first half avg vs second half avg)
    let trend = 0;
    if (data.length > 1) {
        const midPoint = Math.floor(data.length / 2);
        const firstHalf = data.slice(0, midPoint);
        const secondHalf = data.slice(midPoint);

        const sumFirst = firstHalf.reduce((acc, curr) => acc + curr.revenue, 0);
        const sumSecond = secondHalf.reduce((acc, curr) => acc + curr.revenue, 0);

        if (sumFirst === 0) {
            trend = sumSecond > 0 ? 100 : 0;
        } else {
            trend = ((sumSecond - sumFirst) / sumFirst) * 100;
        }
    }
    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue Analysis</CardTitle>
                <CardDescription>
                    Showing revenue trends for selected period
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                    <AreaChart
                        accessibilityLayer
                        data={data}
                        margin={{
                            left: 12,
                            right: 12,
                        }}
                    >
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
                                // If value is not a valid date string, return as is
                                if (isNaN(date.getTime())) return value;
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" labelFormatter={(value) => {
                                return new Date(value).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                })
                            }} />}
                        />
                        <Area
                            dataKey="revenue"
                            type="monotone"
                            fill="url(#fillRevenue)"
                            fillOpacity={0.4}
                            stroke="var(--color-revenue)"
                        />
                    </AreaChart>
                </ChartContainer>
            </CardContent>
            <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 leading-none font-medium">
                            Trending {trend >= 0 ? "up" : "down"} by {Math.abs(trend).toFixed(1)}% this period <TrendingUp className={`h-4 w-4 ${trend < 0 ? "rotate-180" : ""}`} />
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 leading-none">
                            Total Revenue: {formatCurrency(totalRevenue)}
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
