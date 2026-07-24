import { describe, expect, it } from "vitest";
import { verdictFor } from "./scoring";

describe("verdict mapping", () => {
  it("maps every boundary deterministically", () => {
    expect(verdictFor(0)).toBe("Poor Match");
    expect(verdictFor(40)).toBe("Average Match");
    expect(verdictFor(60)).toBe("Good Match");
    expect(verdictFor(80)).toBe("Strong Match");
    expect(verdictFor(100)).toBe("Strong Match");
  });
});
