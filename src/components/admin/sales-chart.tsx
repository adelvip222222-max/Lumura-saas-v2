"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesData } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface SalesChartProps {
  data: SalesData[];
  title?: string;
}

export function SalesChart({
  data,
  title = "الإيرادات والأرباح (آخر 30 يوماً)",
}: SalesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            لا توجد بيانات متاحة
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(val: string) => {
                  const date = new Date(val);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(val: number) =>
                  val >= 1000 ? `${(val / 1000).toFixed(0)}k` : String(val)
                }
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === "orders" ? value : formatCurrency(value),
                  name === "revenue" ? "الإيرادات" : name === "profit" ? "الأرباح" : "الطلبات",
                ]}
                labelFormatter={(label: string) =>
                  new Date(label).toLocaleDateString("ar-EG")
                }
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fill="url(#colorRevenue)"
                strokeWidth={2}
                name="الإيرادات"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#22c55e"
                fill="url(#colorProfit)"
                strokeWidth={2}
                name="الأرباح"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
