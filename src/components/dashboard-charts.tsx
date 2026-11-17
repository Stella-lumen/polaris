"use client";

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export type Slice = { name: string; value: number; color: string };
export type TypeBar = { type: string; total: number; completed: number };

function Donut({ title, subtitle, data }: { title: string; subtitle: string; data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="rounded-lg border p-4">
      <div className="font-medium">{title}</div>
      <div className="mb-2 text-xs text-muted-foreground">{subtitle}</div>
      {total === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} strokeWidth={2}>
              {data.map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function EngagementStatusDonut({ data }: { data: Slice[] }) {
  return <Donut title="Engagement Status" subtitle="Distribution by completion status" data={data} />;
}

export function FindingsStatusDonut({ data }: { data: Slice[] }) {
  return <Donut title="Findings Status" subtitle="Distribution by resolution status" data={data} />;
}

export function EngagementsByTypeBar({ data }: { data: TypeBar[] }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="font-medium">Engagements by Type</div>
      <div className="mb-2 text-xs text-muted-foreground">Total vs completed by engagement type</div>
      {data.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="type" width={80} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="Total" fill="#3f3f46" radius={[0, 3, 3, 0]} barSize={10} />
            <Bar dataKey="completed" name="Completed" fill="#16a34a" radius={[0, 3, 3, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
