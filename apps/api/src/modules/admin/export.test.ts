import { describe, expect, it } from "vitest";
import { sanitizeCsvCell, toCsvRow } from "./export";

describe("QA Security Tests: CSV Injection Mitigation", () => {
  it("should escape regular strings safely", () => {
    expect(toCsvRow(["RVCC Contracting", "Saudi Arabia", 1500])).toBe(
      '"RVCC Contracting","Saudi Arabia","1500"'
    );
  });

  it("should escape quotes within strings properly", () => {
    expect(toCsvRow(['Hello "World"'])).toBe('"Hello ""World"""');
  });

  it("should neutralize formula injection characters (=, +, -, @)", () => {
    expect(sanitizeCsvCell("=SUM(A1:A10)")).toBe("\"'=SUM(A1:A10)\"");
    expect(sanitizeCsvCell("+cmd|' /C calc'!A0")).toBe("\"'+cmd|' /C calc'!A0\"");
    expect(sanitizeCsvCell("-100")).toBe("\"'-100\"");
    expect(sanitizeCsvCell("@malicious_domain")).toBe("\"'@malicious_domain\"");
    expect(sanitizeCsvCell("\tTabInjected")).toBe("\"'\tTabInjected\"");
  });

  it("should handle null and undefined safely", () => {
    expect(sanitizeCsvCell(null)).toBe('""');
    expect(sanitizeCsvCell(undefined)).toBe('""');
  });
});
