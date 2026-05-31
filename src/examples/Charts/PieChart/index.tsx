import { useMemo, ReactNode } from "react";

// react-chartjs-2 components
import { Pie } from "react-chartjs-2";

// PieChart configurations
import configs from "examples/Charts/PieChart/configs";

// Declaring props types for PieChart
interface Props {
  icon?: {
    color?: "primary" | "secondary" | "info" | "success" | "warning" | "error" | "light" | "dark";
    component: ReactNode;
  };
  title?: string;
  description?: string | ReactNode;
  height?: string | number;
  chart: {
    labels: string[];
    datasets: {
      label: string;
      backgroundColors: string[];
      data: number[];
    };
  };
  [key: string]: any;
}

function PieChart({
  height = "19.125rem",
  chart,
}: Props): JSX.Element {
  const { data, options } = configs(chart.labels || [], chart.datasets || {});

  return useMemo(
    () => (
      <div style={{ height }}>
        <Pie data={data} options={options} />
      </div>
    ),
    [chart, height],
  );
}

export default PieChart;
