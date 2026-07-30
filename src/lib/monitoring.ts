import { createMonitoringSnapshot } from "./automation";

export async function getMonitoringSnapshot() {
  return createMonitoringSnapshot({
    errors: 0,
  });
}
