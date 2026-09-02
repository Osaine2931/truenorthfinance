import { createFileRoute } from "@tanstack/react-router";
import { runAutomationJobs } from "@/lib/automation";

/**
 * Scheduled automation entry point (Vercel Cron / external scheduler).
 * Requires the CRON_SECRET, supplied via `Authorization: Bearer <secret>`,
 * an `x-cron-secret` header, or `?secret=` for schedulers that cannot set headers.
 */
async function handle(request: Request) {
  const expected = process.env["CRON_SECRET"] ?? "";
  if (!expected) {
    console.error("[cron] rejected: CRON_SECRET is not configured");
    return new Response("Not configured", { status: 503 });
  }

  const url = new URL(request.url);
  const provided =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("secret") ??
    "";

  if (provided !== expected) {
    console.error("[cron] rejected: invalid secret");
    return new Response("Unauthorized", { status: 401 });
  }

  const summary = await runAutomationJobs();
  return Response.json(summary, { status: summary.status === "ok" ? 200 : 500 });
}

export const Route = createFileRoute("/api/public/cron")({
  server: {
    handlers: {
      GET: async ({ request }) => handle(request),
      POST: async ({ request }) => handle(request),
    },
  },
});
