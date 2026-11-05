import { describe, it, expect } from "vitest";
import { compareChairs, floorRank } from "../../src/core/utils/floors.js";

describe("floor plan ordering", () => {
  it("orders floors naturally: basement, ground, first, second, then others", () => {
    const floors = [
      "Terrace",
      "Second floor",
      "Ground floor",
      "First floor",
      "Basement",
      "Floor 3",
    ];
    expect(
      [...floors].sort(
        (a, b) => floorRank(a) - floorRank(b) || a.localeCompare(b),
      ),
    ).toEqual([
      "Basement",
      "Ground floor",
      "First floor",
      "Second floor",
      "Floor 3",
      "Terrace",
    ]);
  });
  it("orders chairs by floor, then sort order, then name with numbers", () => {
    const c = (name, floor, sortOrder = 0) => ({ name, floor, sortOrder });
    const list = [
      c("Chair 10", "Ground floor"),
      c("Spa Room", "First floor"),
      c("Chair 2", "Ground floor"),
      c("VIP", "Ground floor", -1),
    ];
    expect(list.sort(compareChairs).map((x) => x.name)).toEqual([
      "VIP",
      "Chair 2",
      "Chair 10",
      "Spa Room",
    ]);
  });
});
