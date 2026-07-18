import { getApiBaseUrl } from "./api-base-url";

export type SystemStatus = {
  status: "ok";
  database: {
    status: "operational" | "degraded" | "maintenance";
    checked_at: string;
  };
};

export async function getSystemStatus(): Promise<SystemStatus> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/system-status`);
  if (!response.ok) {
    throw new Error("System status is unavailable.");
  }
  return (await response.json()) as SystemStatus;
}
