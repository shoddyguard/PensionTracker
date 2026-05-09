"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: Array<{ date: string; value: number }>;
}

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function ValueChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <p className="text-sm text-gray-400 text-center py-10">
        Not enough snapshots to display a chart.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickFormatter={(v) =>
            new Date(v + "T12:00:00").toLocaleDateString("en-GB", {
              month: "short",
              year: "2-digit",
            })
          }
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickFormatter={(v) => gbp.format(v)}
          width={80}
        />
        <Tooltip
          formatter={(v: number) => [gbp.format(v), "Value"]}
          labelFormatter={(l) =>
            new Date(l + "T12:00:00").toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          }
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#111827"
          strokeWidth={2}
          dot={{ r: 3, fill: "#111827" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
