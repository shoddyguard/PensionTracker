"use client";

import { useEffect, useState } from "react";
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

function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains("dark"));
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function ValueChart({ data }: Props) {
  const isDark = useIsDark();

  if (data.length < 2) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">
        Not enough snapshots to display a chart.
      </p>
    );
  }

  const gridColor = isDark ? "#374151" : "#f3f4f6";
  const tickColor = isDark ? "#6b7280" : "#9ca3af";
  const lineColor = isDark ? "#e5e7eb" : "#111827";

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: tickColor }}
          tickFormatter={(v) =>
            new Date(v + "T12:00:00").toLocaleDateString("en-GB", {
              month: "short",
              year: "2-digit",
            })
          }
        />
        <YAxis
          tick={{ fontSize: 11, fill: tickColor }}
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
          contentStyle={isDark ? { backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f9fafb" } : undefined}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={2}
          dot={{ r: 3, fill: lineColor }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
