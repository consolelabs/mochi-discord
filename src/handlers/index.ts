import healthcheck from "./healthcheck-handler"

export default [
  {
    method: "get",
    route: "/health",
    handler: healthcheck,
    protected: true,
  },
]
