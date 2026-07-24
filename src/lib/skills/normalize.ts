import { SKILL_ALIASES } from "./aliases";

export function normalizeSkill(skill: string) {
  const normalized = skill.trim().toLowerCase().replace(/\s+/g, " ");
  return SKILL_ALIASES[normalized] ?? normalized;
}

export function normalizeSkills(skills: string[]) {
  return [...new Set(skills.map(normalizeSkill).filter(Boolean))];
}

export function matchSkills(candidate: string[], required: string[]) {
  const owned = new Set(normalizeSkills(candidate));
  const normalizedRequired = normalizeSkills(required);
  return {
    matched: normalizedRequired.filter((skill) => owned.has(skill)),
    missing: normalizedRequired.filter((skill) => !owned.has(skill)),
  };
}
