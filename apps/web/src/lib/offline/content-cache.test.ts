import { beforeEach, describe, expect, it } from "vitest";

import {
  clearCache,
  listCacheEntries,
  readFromCache,
  saveToCache,
} from "./content-cache";

beforeEach(() => {
  clearCache();
});

describe("content-cache", () => {
  it("round-trips a saved value", () => {
    saveToCache("readiness-session:stu_1", { session_id: "sess_1" });

    expect(readFromCache("readiness-session:stu_1")).toEqual({
      session_id: "sess_1",
    });
  });

  it("returns null for a missing key", () => {
    expect(readFromCache("missing-key")).toBeNull();
  });

  it("overwrites an existing entry for the same key", () => {
    saveToCache("k", { value: 1 });
    saveToCache("k", { value: 2 });

    expect(readFromCache("k")).toEqual({ value: 2 });
    expect(listCacheEntries()).toHaveLength(1);
  });

  it("lists all cached entries", () => {
    saveToCache("a", { x: 1 });
    saveToCache("b", { x: 2 });

    const entries = listCacheEntries();
    expect(entries.map((e) => e.key).sort()).toEqual(["a", "b"]);
  });
});
