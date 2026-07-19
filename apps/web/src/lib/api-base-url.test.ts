import { describe, expect, it } from "vitest";

import {
  ApiConfigurationError,
  LOCAL_API_BASE_URL,
  PRODUCTION_API_BASE_URL,
  resolveApiBaseUrl,
} from "./api-base-url";

describe("resolveApiBaseUrl", () => {
  it("uses localhost only for development without explicit configuration", () => {
    expect(resolveApiBaseUrl({ defaultUrl: LOCAL_API_BASE_URL })).toBe(
      LOCAL_API_BASE_URL,
    );
  });

  it("uses the established Railway origin in production, never localhost", () => {
    const resolved = resolveApiBaseUrl({ defaultUrl: PRODUCTION_API_BASE_URL });
    expect(resolved).toBe("https://ailearn-production-ec5e.up.railway.app");
    expect(resolved).not.toContain("localhost");
  });

  it("honors an explicit VITE_API_BASE_URL", () => {
    expect(
      resolveApiBaseUrl({
        configuredUrl: "https://api.example.test/path/",
        defaultUrl: PRODUCTION_API_BASE_URL,
      }),
    ).toBe("https://api.example.test");
  });

  it("rejects an invalid explicit API URL", () => {
    expect(() =>
      resolveApiBaseUrl({
        configuredUrl: "not-a-url",
        defaultUrl: PRODUCTION_API_BASE_URL,
      }),
    ).toThrow(ApiConfigurationError);
  });
});
