import { useEffect, useRef } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface ChartProps {
  type: "line" | "area" | "bar" | "pie" | "donut" | "scatter" | "bubble";
  height: number;
  options: ApexOptions;
  series: any[];
}

export function Chart({ type, height, options, series }: ChartProps) {
  return (
    <ReactApexChart
      type={type}
      height={height}
      options={options}
      series={series}
    />
  );
}