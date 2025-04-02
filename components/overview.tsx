"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Пн",
    total: 12,
  },
  {
    name: "Вт",
    total: 15,
  },
  {
    name: "Ср",
    total: 18,
  },
  {
    name: "Чт",
    total: 14,
  },
  {
    name: "Пт",
    total: 16,
  },
  {
    name: "Сб",
    total: 8,
  },
  {
    name: "Вс",
    total: 6,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}