import { describe, it, expect } from "vitest";
import {
  money,
  initials,
  avatarClass,
  stockLevel,
  fmtTime,
  normalizePhone,
  CATEGORY_LABEL,
  PAYMENT_LABEL,
} from "@/lib/format";

describe("money", () => {
  it("formats with a $ and thousands separators, rounding", () => {
    expect(money(0)).toBe("$0");
    expect(money(642)).toBe("$642");
    expect(money(1234)).toBe("$1,234");
    expect(money(58.6)).toBe("$59");
  });
});

describe("initials", () => {
  it("takes up to two uppercase initials", () => {
    expect(initials("Rutendo Chikowore")).toBe("RC");
    expect(initials("tatenda")).toBe("T");
    expect(initials("Anna Maria Jones")).toBe("AM");
  });
});

describe("avatarClass", () => {
  it("is stable for the same id and within a-0..a-3", () => {
    const a = avatarClass("abc-123");
    expect(a).toBe(avatarClass("abc-123"));
    expect(["a-0", "a-1", "a-2", "a-3"]).toContain(a);
  });
});

describe("stockLevel", () => {
  it("flags low at/below reorder-2 or <=2", () => {
    expect(stockLevel(3, 5)).toBe("low"); // 3 <= 5-2
    expect(stockLevel(2, 8)).toBe("low"); // <= 2
  });
  it("warns at/below reorder but above the low threshold", () => {
    expect(stockLevel(6, 6)).toBe("warn");
    expect(stockLevel(5, 6)).toBe("warn");
  });
  it("is ok above reorder", () => {
    expect(stockLevel(14, 6)).toBe("ok");
  });
});

describe("fmtTime", () => {
  it("formats 24h ISO times into 12h am/pm", () => {
    expect(fmtTime("2026-06-05T09:00:00")).toBe("9:00am");
    expect(fmtTime("2026-06-05T14:30:00")).toBe("2:30pm");
    expect(fmtTime("2026-06-05T00:05:00")).toBe("12:05am");
  });
});

describe("normalizePhone (Zimbabwe E.164)", () => {
  it("collapses all formats of the same number to one canonical value", () => {
    const canonical = "+263772341180";
    expect(normalizePhone("+263 77 234 1180")).toBe(canonical);
    expect(normalizePhone("0772341180")).toBe(canonical);
    expect(normalizePhone("263772341180")).toBe(canonical);
    expect(normalizePhone("772341180")).toBe(canonical);
    expect(normalizePhone("00263772341180")).toBe(canonical);
    expect(normalizePhone("(077) 234-1180")).toBe(canonical);
  });
  it("returns empty for empty input", () => {
    expect(normalizePhone("")).toBe("");
  });
});

describe("label maps", () => {
  it("maps service categories and payment methods", () => {
    expect(CATEGORY_LABEL.hair).toBe("Hair");
    expect(CATEGORY_LABEL.barber).toBe("Barber");
    expect(PAYMENT_LABEL.mobile_money).toBe("EcoCash");
  });
});
