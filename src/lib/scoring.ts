import type { ParsedJobDescription, ParsedResume } from "./schemas";
import { matchSkills, normalizeSkills } from "./skills/normalize";

export const SCORE_WEIGHTS = {
  requiredSkills: 0.3,
  relevantExperience: 0.25,
  responsibilities: 0.15,
  educationAndCertifications: 0.1,
  keywordCoverage: 0.15,
  resumeQuality: 0.05,
} as const;

const percentage = (matched: number, total: number) =>
  total === 0 ? 100 : Math.round((matched / total) * 100);
const clamp = (score: number) => Math.min(100, Math.max(0, Math.round(score)));

export function verdictFor(score: number) {
  if (score < 40) return "Poor Match" as const;
  if (score < 60) return "Average Match" as const;
  if (score < 80) return "Good Match" as const;
  return "Strong Match" as const;
}

export function scoreResume(resume: ParsedResume, job: ParsedJobDescription) {
  const candidateSkills = normalizeSkills([
    ...resume.skills.technical, ...resume.skills.tools, ...resume.skills.frameworks,
    ...resume.skills.databases, ...resume.skills.cloudPlatforms,
    ...resume.experience.flatMap((item) => item.technologies),
    ...resume.projects.flatMap((item) => item.technologies),
  ]);
  const skillMatch = matchSkills(candidateSkills, [
    ...job.requiredSkills, ...job.requiredTools, ...job.requiredFrameworks,
  ]);
  const preferredMatch = matchSkills(candidateSkills, [
    ...job.preferredSkills, ...job.preferredTools,
  ]);
  const requiredSkills = percentage(
    skillMatch.matched.length,
    skillMatch.matched.length + skillMatch.missing.length,
  );
  const minimumYears = job.minimumExperienceYears;
  const candidateYears = resume.estimatedExperienceYears;
  const yearsRatio =
    minimumYears && candidateYears !== null
      ? Math.min(1, candidateYears / minimumYears)
      : 1;
  const experienceText = resume.experience
    .flatMap((item) => [...item.description, ...item.achievements])
    .join(" ")
    .toLowerCase();
  const responsibilityTerms = normalizeSkills(job.responsibilitiesKeywords);
  const responsibilityMatches = responsibilityTerms.filter((term) =>
    experienceText.includes(term),
  ).length;
  const responsibilities = percentage(responsibilityMatches, responsibilityTerms.length);
  const educationText = resume.education
    .map((item) => `${item.degree ?? ""} ${item.fieldOfStudy ?? ""}`)
    .join(" ")
    .toLowerCase();
  const certificationText = resume.certifications.map((item) => item.name).join(" ").toLowerCase();
  const requiredEducationItems = [...job.requiredEducation, ...job.requiredCertifications];
  const educationMatches = requiredEducationItems.filter((item) =>
    `${educationText} ${certificationText}`.includes(item.toLowerCase()),
  ).length;
  const educationAndCertifications = percentage(educationMatches, requiredEducationItems.length);
  const importantKeywords = normalizeSkills([
    ...job.requiredSkills, ...job.preferredSkills, ...job.domainKeywords,
  ]);
  const resumeText = JSON.stringify(resume).toLowerCase();
  const matchedKeywords = importantKeywords.filter((word) => resumeText.includes(word));
  const keywordCoverage = percentage(matchedKeywords.length, importantKeywords.length);
  const qualityChecks = [
    resume.personalInfo.name, resume.personalInfo.email, resume.personalInfo.phone,
    resume.summary, resume.experience.length > 0, resume.education.length > 0,
    candidateSkills.length > 0,
  ];
  const resumeQuality = percentage(qualityChecks.filter(Boolean).length, qualityChecks.length);
  const relevantExperience = clamp(yearsRatio * 70 + responsibilities * 0.3);
  const scoreBreakdown = {
    requiredSkills, relevantExperience, responsibilities,
    educationAndCertifications, keywordCoverage, resumeQuality,
  };
  const overallScore = clamp(
    Object.entries(SCORE_WEIGHTS).reduce(
      (total, [key, weight]) =>
        total + scoreBreakdown[key as keyof typeof scoreBreakdown] * weight,
      0,
    ),
  );

  return {
    overallScore,
    verdict: verdictFor(overallScore),
    scoreBreakdown,
    matchedSkills: skillMatch.matched,
    missingRequiredSkills: skillMatch.missing,
    missingPreferredSkills: preferredMatch.missing,
    matchedKeywords,
    missingKeywords: importantKeywords.filter((word) => !matchedKeywords.includes(word)),
  };
}
