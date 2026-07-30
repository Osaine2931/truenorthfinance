import { defineEventHandler } from "h3";
import { getMonitoringSnapshot } from "../src/lib/monitoring";

export default defineEventHandler(async () => {
  const snapshot = await getMonitoringSnapshot();
  return {
    ok: true,
    snapshot,
  };
});
