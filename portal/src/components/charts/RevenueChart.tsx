import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  className?: string;
  data?: Array<{ date: string; revenue: number }>;
}

export function RevenueChart({ className, data = [] }: RevenueChartProps) {
  // Use provided data or show empty state
  const chartData = data.length > 0 ? data : [
    { date: 'No data', revenue: 0 },
  ];

  return (
    <div className={className}>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-slate-500">
          <p>No revenue data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
              interval="preserveStartEnd"
              tickFormatter={(value) => {
                // Format date to show only day/month (e.g., "20/01")
                const date = new Date(value);
                if (isNaN(date.getTime())) return value;
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number | undefined) => [`₹${(value || 0).toLocaleString()}`, 'Revenue']}
              labelStyle={{ color: '#64748b', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
