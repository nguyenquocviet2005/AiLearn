import { afterEach, describe, expect, it, vi } from "vitest";

import { reportTestFixture } from "@/features/teacher/report/report-test-fixture";
import { ApiConfigurationError } from "@/lib/api-base-url";
import { createHttpTeacherReportRepository } from "./teacher-report-repository";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createHttpTeacherReportRepository", () => {
  it("honors the centralized explicit API base", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => reportTestFixture,
    });
    vi.stubGlobal("fetch", fetchMock);

    const repository = createHttpTeacherReportRepository(
      () => "https://api.example.test",
    );

    await expect(repository.getReport()).resolves.toEqual(reportTestFixture);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/reports/report_demo_01",
    );
  });

  it("classifies deployment configuration failures", async () => {
    const repository = createHttpTeacherReportRepository(() => {
      throw new ApiConfigurationError("invalid production configuration");
    });

    await expect(repository.getReport()).rejects.toMatchObject({
      kind: "configuration",
    });
  });

  it("classifies unreachable and rejected report requests", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    const repository = createHttpTeacherReportRepository(
      () => "https://api.example.test",
    );
    await expect(repository.getReport()).rejects.toMatchObject({
      kind: "unavailable",
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(repository.getReport()).rejects.toMatchObject({
      kind: "response",
    });
  });
});
