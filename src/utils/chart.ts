import { createCanvas } from "canvas"
import { ChartJSNodeCanvas } from "chartjs-node-canvas"

function getGradientColor(fromColor: string, toColor: string) {
  const canvas = createCanvas(100, 100)
  const ctx = canvas.getContext("2d")
  const gradient = ctx.createLinearGradient(0, 0, 0, 400)
  gradient.addColorStop(0, fromColor)
  gradient.addColorStop(1, toColor)
  return gradient
}

export async function drawLineChart({
  title,
  labels,
  data,
}: {
  title?: string
  labels: string[]
  data: number[]
}) {
  const borderColor = "#009cdb"
  const backgroundColor = getGradientColor(
    "rgba(53,83,192,0.9)",
    "rgba(58,69,110,0.5)",
  )
  const chartCanvas = new ChartJSNodeCanvas({
    width: 700,
    height: 450,
    backgroundColour: "#202020",
  })
  const axisConfig = {
    ticks: {
      font: { size: 16 },
      color: borderColor,
    },
    grid: {
      color: "rgba(0,0,0,0.2)",
      borderWidth: 1,
      borderColor: borderColor,
    },
  }
  return chartCanvas.renderToBuffer({
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: title,
          data,
          borderWidth: 2,
          pointRadius: 0,
          fill: true,
          borderColor,
          backgroundColor,
          tension: 0.5,
        },
      ],
    },
    options: {
      layout: {
        padding: { left: 15, bottom: 15, top: 15, right: 15 },
      },
      scales: {
        y: axisConfig,
        x: axisConfig,
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
