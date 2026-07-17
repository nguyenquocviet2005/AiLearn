export type SystemStatus = {
  status: "ok";
  database: {
    status: "operational" | "degraded" | "maintenance";
    checked_at: string;
  };
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function getSystemStatus(): Promise<SystemStatus> {
  const response = await fetch(`${apiBaseUrl}/api/v1/system-status`);
  if (!response.ok) {
    throw new Error("System status is unavailable.");
  }
  return (await response.json()) as SystemStatus;
}
