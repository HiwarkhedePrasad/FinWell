import React from "react";
import CustomTooltip from "./CustomTooltip";
import CustomLegend from "./CustomLegend";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CustomPieChart = ({ data, label, colors }) => {
  // Calculate total amount from data
  const totalAmount = data?.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  // Format total as Indian Rupee
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(totalAmount);

  return (
    <ResponsiveContainer width="100%" height={380}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={130}
          innerRadius={100}
          labelLine={false}
        >
          {data?.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={CustomTooltip} />
        <Legend content={CustomLegend} />

        <text
          x="50%"
          y="50%"
          dy={-25}
          textAnchor="middle"
          fill="#666"
          fontSize="14px"
        >
          {label}
        </text>
        <text
          x="50%"
          y="50%"
          dy={8}
          textAnchor="middle"
          fill="#333"
          fontSize="24px"
          fontWeight="600"
        >
          {formattedAmount}
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default CustomPieChart;
