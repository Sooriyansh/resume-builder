import type { ParsedJobDescription, ParsedResume } from "@/lib/schemas";

const SKILLS = [
  "javascript", "typescript", "python", "java", "c++", "c#", "html", "css",
  "react", "next.js", "node.js", "express.js", "django", "flask", "spring",
  "mongodb", "postgresql", "mysql", "sqlite", "redis", "aws", "azure",
  "google cloud platform", "docker", "kubernetes", "git", "github", "ci/cd",
  "restful api", "graphql", "microservices", "tailwind css", "bootstrap",
  "opencv", "machine learning", "data structures", "algorithms",
  "angular", "vue", "svelte", "redux", "nestjs", "fastapi", ".net",
  "oracle", "firebase", "supabase", "linux", "jenkins", "terraform",
  "pandas", "numpy", "pytorch", "tensorflow", "agile", "scrum", "jira",
];

const SOFT_SKILLS = [
  "communication", "leadership", "collaboration", "teamwork",
  "problem solving", "analytical", "adaptability", "time management",
];

function presentSkills(text: string) {
  const lower = text.toLowerCase();
  return SKILLS.filter((skill) => {
    const variants = {
      "next.js": ["next.js", "nextjs"],
      "node.js": ["node.js", "nodejs"],
      "express.js": ["express.js", "expressjs"],
      "google cloud platform": ["google cloud platform", "gcp"],
      "restful api": ["restful api", "rest api"],
      "ci/cd": ["ci/cd", "continuous integration"],
    }[skill] ?? [skill];
    return variants.some((variant) => {
      const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(lower);
    });
  });
}

function lines(text: string) {
  return text.split(/\n/).map((line) => line.trim()).filter(Boolean);
}

function firstMatch(text: string, pattern: RegExp) {
  return text.match(pattern)?.[0] ?? null;
}

function section(text: string, names: string[]) {
  const allLines = lines(text);
  const start = allLines.findIndex((line) => {
    const normalized = line.replace(/[^a-z]/gi, "").toLowerCase();
    return names.some((name) => normalized === name.replace(/[^a-z]/gi, "").toLowerCase());
  });
  if (start < 0) return [];
  const knownHeaders = /^(summary|profile|skills|experience|employment|projects?|education|certifications?|awards?|languages?|interests?)$/i;
  const result: string[] = [];
  for (const line of allLines.slice(start + 1)) {
    if (knownHeaders.test(line.replace(/[^a-z]/gi, ""))) break;
    result.push(line);
  }
  return result;
}

function bullets(input: string[]) {
  return input
    .filter((line) => /^(?:[-•*]|\d+\.)/.test(line) || line.length > 45)
    .map((line) => line.replace(/^(?:[-•*]|\d+\.)\s*/, ""))
    .slice(0, 20);
}

function yearRange(text: string) {
  const years = text.match(/\b(?:19|20)\d{2}\b/g) ?? [];
  return { start: years[0] ?? null, end: years[1] ?? null };
}

export function parseResumeLocally(text: string): ParsedResume {
  const documentLines = lines(text);
  const urls = text.match(/https?:\/\/\S+|(?:linkedin\.com|github\.com)\/\S+/gi) ?? [];
  const technical = presentSkills(text);
  const experienceLines = section(text, ["experience", "employment", "work experience"]);
  const educationLines = section(text, ["education"]);
  const projectLines = section(text, ["project", "projects"]);
  const certificationLines = section(text, ["certification", "certifications"]);
  const degreeLine = educationLines.find((line) =>
    /\b(bachelor|master|bca|mca|b\.?tech|m\.?tech|degree|diploma)\b/i.test(line),
  );
  const summaryLines = section(text, ["summary", "profile", "professional summary"]);
  const experienceHeader = experienceLines.find((line) =>
    /\b(intern|developer|engineer|manager|analyst|designer|consultant|specialist)\b/i.test(line),
  );
  const experienceDates = yearRange(experienceLines.join(" "));
  const experienceYears = experienceDates.start
    ? Math.max(
        0,
        (experienceDates.end ? Number(experienceDates.end) : new Date().getFullYear()) -
          Number(experienceDates.start),
      )
    : null;

  return {
    personalInfo: {
      name: documentLines[0]?.replace(/\s+(?=\S)/g, " ").slice(0, 100) ?? null,
      email: firstMatch(text, /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i),
      phone: firstMatch(text, /(?:\+\d{1,3}[\s-]?)?(?:\d[\s-]?){8,12}/),
      location: null,
      linkedinUrl: urls.find((url) => /linkedin\.com/i.test(url)) ?? null,
      githubUrl: urls.find((url) => /github\.com/i.test(url)) ?? null,
      portfolioUrl: urls.find((url) => !/(linkedin|github)\.com/i.test(url)) ?? null,
    },
    headline: documentLines.find((line) =>
      /\b(developer|engineer|manager|analyst|designer|consultant)\b/i.test(line),
    ) ?? null,
    summary: (summaryLines.length ? summaryLines : documentLines.slice(1, 4))
      .join(" ").slice(0, 1_500) || null,
    skills: {
      technical,
      soft: SOFT_SKILLS.filter((skill) => text.toLowerCase().includes(skill)),
      tools: technical.filter((skill) => ["git", "github", "docker", "kubernetes"].includes(skill)),
      frameworks: technical.filter((skill) =>
        ["react", "next.js", "express.js", "django", "flask", "spring", "tailwind css", "bootstrap"].includes(skill),
      ),
      databases: technical.filter((skill) =>
        ["mongodb", "postgresql", "mysql", "sqlite", "redis"].includes(skill),
      ),
      cloudPlatforms: technical.filter((skill) =>
        ["aws", "azure", "google cloud platform"].includes(skill),
      ),
    },
    experience: experienceHeader ? [{
      jobTitle: experienceHeader.split(/[|,@]/)[0]?.trim() || null,
      company: experienceHeader.split(/[|,@]/)[1]?.trim() || null,
      location: null,
      startDate: experienceDates.start,
      endDate: experienceDates.end,
      isCurrentRole: /\b(present|current|now)\b/i.test(experienceLines.join(" ")),
      description: bullets(experienceLines),
      achievements: bullets(experienceLines).filter((line) => /\d+%|\d+\+/.test(line)),
      technologies: presentSkills(experienceLines.join(" ")),
    }] : [],
    education: degreeLine ? [{
      degree: degreeLine,
      fieldOfStudy: null,
      institution: null,
      location: null,
      startYear: null,
      graduationYear: firstMatch(degreeLine, /\b(?:19|20)\d{2}\b/),
      grade: null,
    }] : [],
    certifications: certificationLines
      .filter((line) => line.length > 3)
      .slice(0, 10)
      .map((name) => ({ name, issuer: null, issueDate: null, expiryDate: null })),
    projects: projectLines.length ? [{
      name: projectLines.find((line) => line.length < 100) ?? "Project",
      description: projectLines.join(" ").slice(0, 1_500),
      role: null,
      technologies: presentSkills(projectLines.join(" ")),
      achievements: bullets(projectLines).filter((line) => /\d+%|\d+\+/.test(line)),
      url: urls.find((url) => !/linkedin\.com/i.test(url)) ?? null,
    }] : [],
    awards: [],
    publications: [],
    volunteerExperience: [],
    languages: [],
    interests: [],
    estimatedExperienceYears: experienceYears,
  };
}

export function parseJobDescriptionLocally(
  text: string,
  title?: string,
  companyName?: string,
): ParsedJobDescription {
  const lower = text.toLowerCase();
  const skills = presentSkills(text);
  const preferredText = lines(text)
    .filter((line) => /\b(preferred|nice to have|bonus|desirable)\b/i.test(line))
    .join(" ");
  const preferredSkills = presentSkills(preferredText);
  const requiredSkills = skills.filter((skill) => !preferredSkills.includes(skill));
  const years = text.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)/i);
  const responsibilityLines = lines(text)
    .filter((line) => /^(?:[-•*]|\d+\.)/.test(line))
    .map((line) => line.replace(/^(?:[-•*]|\d+\.)\s*/, ""))
    .slice(0, 30);
  const workMode = /\bremote\b/.test(lower)
    ? "remote"
    : /\bhybrid\b/.test(lower)
      ? "hybrid"
      : /\b(?:on-site|onsite)\b/.test(lower)
        ? "onsite"
        : "unknown";

  return {
    jobTitle: title || null,
    companyName: companyName || null,
    location: null,
    employmentType: /\bfull[- ]time\b/.test(lower)
      ? "Full-time"
      : /\bpart[- ]time\b/.test(lower)
        ? "Part-time"
        : null,
    workMode,
    seniorityLevel: firstMatch(text, /\b(?:intern|junior|mid-level|senior|lead|principal)\b/i),
    minimumExperienceYears: years ? Number(years[1]) : null,
    maximumExperienceYears: null,
    requiredSkills,
    preferredSkills,
    requiredTools: requiredSkills.filter((skill) =>
      ["git", "github", "docker", "kubernetes", "jenkins", "jira", "terraform"].includes(skill),
    ),
    preferredTools: preferredSkills.filter((skill) =>
      ["git", "github", "docker", "kubernetes", "jenkins", "jira", "terraform"].includes(skill),
    ),
    requiredFrameworks: requiredSkills.filter((skill) =>
      ["react", "angular", "vue", "next.js", "express.js", "nestjs", "django", "flask", "fastapi", "spring"].includes(skill),
    ),
    requiredEducation: text.match(/\b(?:bachelor'?s?|master'?s?|bca|mca|b\.?tech|m\.?tech)\b/gi) ?? [],
    preferredEducation: [],
    requiredCertifications: [],
    preferredCertifications: [],
    responsibilities: responsibilityLines,
    requiredSoftSkills: SOFT_SKILLS.filter((skill) => lower.includes(skill)),
    preferredSoftSkills: [],
    domainKeywords: skills,
    industry: null,
    responsibilitiesKeywords: responsibilityLines.flatMap((line) =>
      line.toLowerCase().match(/[a-z][a-z+#./-]{2,}/g) ?? [],
    ).slice(0, 50),
  };
}
