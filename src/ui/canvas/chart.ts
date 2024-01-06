import { CanvasGradient } from "canvas"
import { ChartJSNodeCanvas } from "chartjs-node-canvas"
import { utils } from "@consolelabs/mochi-formatter"
import "../chartjs/date-adapter"
import { getGradientColor } from "./color"

const chartCanvas = new ChartJSNodeCanvas({ width: 700, height: 450 })

export async function renderChartImage({
  chartLabel,
  labels,
  data = [],
  colorConfig,
  lineOnly,
}: {
  chartLabel?: string
  labels: string[]
  data: number[]
  colorConfig?: {
    borderColor: string
    backgroundColor: string | CanvasGradient
  }
  lineOnly?: boolean
}) {
  if (!colorConfig) {
    colorConfig = {
      borderColor: "#009cdb",
      backgroundColor: getGradientColor(
        "rgba(53,83,192,0.9)",
        "rgba(58,69,110,0.5)",
      ),
    }
  }
  if (lineOnly) {
    colorConfig.backgroundColor = "rgba(0, 0, 0, 0)"
  }
  const xAxisConfig = {
    ticks: {
      font: {
        size: 16,
      },
      color: colorConfig.borderColor,
    },
    grid: {
      borderColor: colorConfig.borderColor,
    },
  }
  const yAxisConfig = {
    ticks: {
      font: {
        size: 16,
      },
      color: colorConfig.borderColor,
      callback: (value: string | number) =>
        utils.formatDigit({ value, subscript: true }),
    },
    grid: {
      borderColor: colorConfig.borderColor,
    },
  }
  return await chartCanvas.renderToBuffer({
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: chartLabel,
          data,
          borderWidth: lineOnly ? 10 : 3,
          pointRadius: 0,
          fill: true,
          ...colorConfig,
          tension: 0.2,
        },
      ],
    },
    options: {
      scales: {
        y: yAxisConfig,
        x: xAxisConfig,
      },
      plugins: {
        legend: {
          labels: {
            // This more specific font property overrides the global property
            font: {
              size: 18,
            },
          },
        },
      },
      ...(lineOnly && {
        scales: {
          x: {
            grid: {
              display: false,
            },
            display: false,
          },
          y: {
            grid: {
              display: false,
            },
            display: false,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      }),
    },
  })
}

export async function renderPlotChartImage({
  chartLabel,
  data = [],
  colorConfig,
}: {
  chartLabel?: string
  data: {
    x: number
    y: number
  }[]
  colorConfig?: {
    borderColor: string
    backgroundColor: string | CanvasGradient
  }
}) {
  if (!colorConfig) {
    colorConfig = {
      borderColor: "#009cdb",
      backgroundColor: getGradientColor(
        "rgba(53,83,192,0.9)",
        "rgba(58,69,110,0.5)",
      ),
    }
  }
  const axisConfig = {
    ticks: {
      font: {
        size: 16,
      },
      color: colorConfig.borderColor,
    },
    grid: {
      borderColor: colorConfig.borderColor,
    },
  }

  return chartCanvas.renderToBuffer({
    type: "scatter",
    data: {
      datasets: [
        {
          label: chartLabel,
          data,
          borderWidth: 3,
          fill: true,
          ...colorConfig,
        },
      ],
    },
    options: {
      scales: {
        x: {
          type: "time",
          time: {
            unit: "day",
          },
          ticks: axisConfig.ticks,
          grid: axisConfig.grid,
        },
        y: axisConfig,
      },
      plugins: {
        legend: {
          labels: {
            // This more specific font property overrides the global property
            font: {
              size: 18,
            },
          },
        },
      },
    },
  })
}
