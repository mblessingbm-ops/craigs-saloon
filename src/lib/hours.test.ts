import { describe, it, expect } from "vitest";
import { slotError, asHours, dayWindow, DEFAULT_HOURS, type OperatingHours } from "@/lib/hours";

// Matches the seeded saloon hours: Mon–Thu 08–18, Fri 08–19, Sat 08–17, closed Sun.
const HOURS: OperatingHours = {
  mon: ["08:00", "18:00"],
  tue: ["08:00", "18:00"],
  wed: ["08:00", "18:00"],
  thu: ["08:00", "18:00"],
  fri: ["08:00", "19:00"],
  sat: ["08:00", "17:00"],
  sun: null,
};

// Far-future week so the past-time guard never trips: 2026-12-07 is a Monday,
// 2026-12-12 a Saturday, 2026-12-13 a Sunday.
const at = (date: string, time: string) => new Date(`${date}T${time}:00+02:00`);

describe("asHours", () => {
  it("parses well-formed JSON", () => {
    expect(asHours(HOURS).mon).toEqual(["08:00", "18:00"]);
    expect(asHours(HOURS).sun).toBeNull();
  });
  it("falls back to defaults for garbage", () => {
    expect(asHours(null)).toBe(DEFAULT_HOURS);
    expect(asHours("nope")).toBe(DEFAULT_HOURS);
    expect(asHours({})).toBe(DEFAULT_HOURS);
  });
  it("nulls out malformed days but keeps valid ones", () => {
    const parsed = asHours({ mon: ["09:00", "17:00"], tue: "bad", wed: ["08:00"] });
    expect(parsed.mon).toEqual(["09:00", "17:00"]);
    expect(parsed.tue).toBeNull();
    expect(parsed.wed).toBeNull();
  });
});

describe("dayWindow", () => {
  it("returns minutes-from-midnight for an open day", () => {
    expect(dayWindow(HOURS, "2026-12-07")).toEqual({ open: 480, close: 1080 }); // Mon 08:00–18:00
  });
  it("returns null for a closed day", () => {
    expect(dayWindow(HOURS, "2026-12-13")).toBeNull(); // Sun
  });
});

describe("slotError", () => {
  it("accepts an in-hours weekday slot", () => {
    expect(slotError(at("2026-12-07", "10:00"), HOURS, 60)).toBeNull(); // Mon 10:00
  });
  it("rejects a past time regardless of hours", () => {
    expect(slotError(at("2020-01-06", "10:00"), HOURS, 60)).toMatch(/past/i);
  });
  it("rejects before opening", () => {
    expect(slotError(at("2026-12-07", "07:00"), HOURS, 60)).toMatch(/before opening/i);
  });
  it("rejects at/after closing", () => {
    expect(slotError(at("2026-12-07", "18:00"), HOURS, 60)).toMatch(/after closing/i);
  });
  it("rejects a service that runs past closing", () => {
    // Sat closes 17:00; a 60-min service at 16:30 would overrun
    expect(slotError(at("2026-12-12", "16:30"), HOURS, 60)).toMatch(/past closing/i);
  });
  it("rejects a closed day", () => {
    expect(slotError(at("2026-12-13", "10:00"), HOURS, 60)).toMatch(/closed on Sundays/i);
  });
  it("honours per-location late hours (Fri until 19:00)", () => {
    expect(slotError(at("2026-12-11", "18:00"), HOURS, 60)).toBeNull(); // Fri 18:00–19:00 OK
  });
});
