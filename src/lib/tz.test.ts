import { describe, it, expect } from "vitest";
import { localDateKey, localDayOf, dayStart, weekdayMon0, addDaysKey, ymOf } from "@/lib/tz";

describe("localDateKey / localDayOf (Africa/Harare = UTC+2)", () => {
  it("rolls to the next day after 22:00 UTC", () => {
    // 23:30 UTC on Jun 5 is 01:30 Jun 6 in Harare
    expect(localDayOf("2026-06-05T23:30:00.000Z")).toBe("2026-06-06");
  });
  it("stays on the same day before 22:00 UTC", () => {
    // 21:00 UTC on Jun 5 is 23:00 Jun 5 in Harare
    expect(localDayOf("2026-06-05T21:00:00.000Z")).toBe("2026-06-05");
  });
  it("formats as YYYY-MM-DD", () => {
    expect(localDateKey(new Date("2026-06-05T08:00:00.000Z"))).toBe("2026-06-05");
  });
});

describe("dayStart", () => {
  it("is midnight Harare = 22:00 UTC the previous day", () => {
    expect(dayStart("2026-06-05").toISOString()).toBe("2026-06-04T22:00:00.000Z");
  });
});

describe("weekdayMon0", () => {
  it("returns Friday = 4 for 2026-06-05", () => {
    expect(weekdayMon0("2026-06-05")).toBe(4);
  });
  it("returns Monday = 0", () => {
    expect(weekdayMon0("2026-06-01")).toBe(0);
  });
});

describe("addDaysKey", () => {
  it("adds within a month", () => {
    expect(addDaysKey("2026-06-05", 1)).toBe("2026-06-06");
  });
  it("rolls over a month boundary", () => {
    expect(addDaysKey("2026-06-30", 1)).toBe("2026-07-01");
  });
  it("goes backwards across a month", () => {
    expect(addDaysKey("2026-07-01", -1)).toBe("2026-06-30");
  });
});

describe("ymOf", () => {
  it("extracts zero-based month and year", () => {
    expect(ymOf("2026-06-05")).toEqual({ year: 2026, month: 5 });
  });
});
