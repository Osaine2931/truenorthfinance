import { defineEventHandler, readBody } from "h3";
import { runAutomationJobs } from "../src/lib/automation";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const secret = body?.secret || event.node.req.headers["x-vercel-cron"] || "";
  const expected = process.env.CRON_SECRET || "";

  if (expected && secret !== expected) {
    return {
      ok: false,
      message: "Unauthorized",
    };
  }

  const summary = await runAutomationJobs();
  return {
    ok: true,
    ...summary,
  };
});
