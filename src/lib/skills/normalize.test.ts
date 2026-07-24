import { describe, expect, it } from "vitest";
import { matchSkills, normalizeSkill, normalizeSkills } from "./normalize";

describe("skill normalization", () => {
  it("normalizes configured aliases case-insensitively", () => {
    expect(normalizeSkill(" ReactJS ")).toBe("react");
    expect(normalizeSkill("AWS Cloud")).toBe("aws");
    expect(normalizeSkill("K8S")).toBe("kubernetes");
  });

  it("removes duplicates", () => {
    expect(normalizeSkills(["JS", "javascript", "JavaScript"])).toEqual(["javascript"]);
  });

  it("matches whole normalized skills without dangerous substrings", () => {
    expect(matchSkills(["React", "CSS"], ["C", "React.js"])).toEqual({
      matched: ["react"],
      missing: ["c"],
    });
  });
});
