import { prisma } from "../db/prisma.js";

async function scoreRangeDistribution() {
  const ranges = [
    { label: "0–19", min: 0, max: 19 },
    { label: "20–39", min: 20, max: 39 },
    { label: "40–59", min: 40, max: 59 },
    { label: "60–79", min: 60, max: 79 },
    { label: "80–100", min: 80, max: 100 },
  ];

  const counts = await Promise.all(
    ranges.map((r) =>
      prisma.job.count({
        where: { score: { gte: r.min, lte: r.max } },
      }),
    ),
  );

  return ranges.map((r, i) => ({
    range: r.label,
    count: counts[i],
  }));
}

export async function getDashboard(req, res, next) {
  try {
    const [
      totalLeads,
      hotLeads,
      withDomain,
      withEmail,
      scoreDistribution,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { score: { gte: 70 } } }),
      prisma.job.count({ where: { companyDomain: { not: null } } }),
      prisma.job.count({ where: { suggestedEmail: { not: null } } }),
      scoreRangeDistribution(),
    ]);

    res.json({
      ok: true,
      metrics: {
        totalLeads,
        hotLeads,
        withDomain,
        withSuggestedEmail: withEmail,
      },
      charts: {
        scoreDistribution,
      },
    });
  } catch (err) {
    next(err);
  }
}
