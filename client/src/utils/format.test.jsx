import { describe, expect, it } from "vitest";
import { displayNameOfUser, formatDate, userIdOf } from "./format.jsx";

describe("formatDate", () => {
  it("pluralizes correctly", () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatDate(oneDayAgo)).toBe("1 day ago");
    expect(formatDate(twoDaysAgo)).toBe("2 days ago");
  });

  it("handles months and invalid input", () => {
    const seventyDaysAgo = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatDate(seventyDaysAgo)).toBe("2 months ago");
    expect(formatDate("not-a-date")).toBe("Unknown date");
    expect(formatDate(null)).toBe("Unknown date");
  });
});

describe("displayNameOfUser", () => {
  it("handles documents, strings, and missing users", () => {
    expect(displayNameOfUser({ displayName: "rish" })).toBe("rish");
    expect(displayNameOfUser("plainName")).toBe("plainName");
    expect(displayNameOfUser(null)).toBe("Unknown");
  });
});

describe("userIdOf", () => {
  it("extracts ids from documents and strings", () => {
    expect(userIdOf({ _id: "abc" })).toBe("abc");
    expect(userIdOf("xyz")).toBe("xyz");
    expect(userIdOf(null)).toBe(null);
  });
});
