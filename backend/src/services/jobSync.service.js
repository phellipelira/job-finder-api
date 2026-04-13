import { collectAdzunaJobs } from "../collectors/adzuna.collector.js";
import { prisma } from "../db/prisma.js";
import { logger } from "../config/logger.js";
import { processJobPayload } from "./jobProcessor.js";
const SOURCE = "adzuna";

export async function syncJobsFromAdzuna() {
  const raw = await collectAdzunaJobs();
  let created = 0;
  let skipped = 0;

  for (const row of raw) {
    const fields = processJobPayload({
      title: row.title,
      company: row.company,
      location: row.location,
      description: row.description,
      redirectUrl: row.redirectUrl,
    });

    try {
      await prisma.job.create({
        data: {
          source: SOURCE,
          title: fields.title,
          company: fields.company,
          location: fields.location,
          description: fields.description,
          redirectUrl: fields.redirectUrl,
          companyDomain: fields.companyDomain,
          suggestedEmail: fields.suggestedEmail,
          score: fields.score,
          isRemote: fields.isRemote,
        },
      });
      created += 1;
    } catch (e) {
      if (e?.code === "P2002") {
        skipped += 1;
        continue;
      }
      logger.error("job_upsert_error", { message: e?.message, redirectUrl: row.redirectUrl });
      throw e;
    }
  }

  logger.info("sync_jobs_complete", { created, skippedDuplicates: skipped });
  return { created, skippedDuplicates: skipped, processed: raw.length };
}
