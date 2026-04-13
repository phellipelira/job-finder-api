export function getHealth(req, res) {
  res.json({
    ok: true,
    service: "job-leads-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
