import { prisma } from "../db/prisma.js";
import { syncJobsFromAdzuna } from "../services/jobSync.service.js";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export async function listJobs(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const q = (req.query.q || "").trim();
    const minScore = req.query.minScore != null && req.query.minScore !== ""
      ? Number(req.query.minScore)
      : null;

    const where = {
      AND: [
        minScore != null && Number.isFinite(minScore)
          ? { score: { gte: minScore } }
          : {},
        q
          ? {
              OR: [
                { company: { contains: q, mode: "insensitive" } },
                { title: { contains: q, mode: "insensitive" } },
                { location: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    };

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          companyDomain: true,
          suggestedEmail: true,
          score: true,
          isRemote: true,
          redirectUrl: true,
          createdAt: true,
        },
      }),
      prisma.job.count({ where }),
    ]);

    res.json({
      ok: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateJobs(req, res, next) {
  try {
    if (!env.adzunaAppId || !env.adzunaAppKey) {
      return res.status(400).json({
        ok: false,
        error: "Adzuna não configurada. Defina ADZUNA_APP_ID e ADZUNA_APP_KEY.",
      });
    }
    logger.info("manual_job_update_started");
    const result = await syncJobsFromAdzuna();
    res.status(200).json({
      ok: true,
      message: "Atualização concluída",
      result,
    });
  } catch (err) {
    next(err);
  }
}
