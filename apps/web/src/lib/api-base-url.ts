export const LOCAL_API_BASE_URL = "http://localhost:8000";
export const PRODUCTION_API_BASE_URL =
  "https://api-production-8a6d.up.railway.app";

export class ApiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiConfigurationError";
  }
}

type ApiBaseUrlOptions = {
  configuredUrl?: string;
  defaultUrl: string;
};

function normalizedHttpOrigin(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiConfigurationError("VITE_API_BASE_URL must be a valid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiConfigurationError(
      "VITE_API_BASE_URL must use HTTP or HTTPS.",
    );
  }
  return url.origin;
}

export function resolveApiBaseUrl({
  configuredUrl,
  defaultUrl,
}: ApiBaseUrlOptions): string {
  const configured = configuredUrl?.trim();
  if (configured) return normalizedHttpOrigin(configured);
  return normalizedHttpOrigin(defaultUrl);
}

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl({
    configuredUrl: import.meta.env.VITE_API_BASE_URL,
    defaultUrl: import.meta.env.DEV
      ? LOCAL_API_BASE_URL
      : PRODUCTION_API_BASE_URL,
  });
}
