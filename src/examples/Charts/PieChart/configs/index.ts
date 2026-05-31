/* eslint-disable no-dupe-keys */

const colorPalette: Record<string, string> = {
  primary: "#e91e63",
  secondary: "#7b809a",
  info: "#1a73e8",
  success: "#4caf50",
  warning: "#fb8c00",
  error: "#f44335",
  dark: "#344767",
  light: "#ffffffcc",
};

const fallbackColor = "#344767";

function configs(labels: any, datasets: any) {
  const backgroundColors: string[] = [];

  if (datasets.backgroundColors) {
    datasets.backgroundColors.forEach((color: string) =>
      backgroundColors.push(colorPalette[color] ?? fallbackColor)
    );
  } else {
    backgroundColors.push(fallbackColor);
  }

  return {
    data: {
      labels,
      datasets: [
        {
          label: datasets.label,
          weight: 9,
          cutout: 0,
          tension: 0.9,
          pointRadius: 2,
          borderWidth: 2,
          backgroundColor: backgroundColors,
          fill: false,
          data: datasets.data,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      interaction: {
        intersect: false,
        mode: "index",
      },
      scales: {
        y: {
          grid: {
            drawBorder: false,
            display: false,
            drawOnChartArea: false,
            drawTicks: false,
          },
          ticks: {
            display: false,
          },
        },
        x: {
          grid: {
            drawBorder: false,
            display: false,
            drawOnChartArea: false,
            drawTicks: false,
          },
          ticks: {
            display: false,
          },
        },
      },
    },
  };
}

export default configs;
