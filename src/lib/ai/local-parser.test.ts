import { describe, expect, it } from "vitest";
import { parseJobDescriptionLocally, parseResumeLocally } from "./local-parser";

describe("local AI fallback parser", () => {
  it("extracts useful structured resume evidence", () => {
    const parsed = parseResumeLocally(`
      Raj Patel
      raj@example.com | +91 98765 43210
      SUMMARY
      Full Stack Developer building scalable applications.
      SKILLS
      JavaScript, React, Next.js, Node.js, MongoDB, Docker, AWS
      EXPERIENCE
      Backend Developer Intern | IdeaClap | 2024 - 2025
      • Built a school ERP for 200+ users using Node.js and MongoDB.
      • Reduced manual processing time by 70%.
      PROJECTS
      Hotel Management System
      Built with React, Node.js and MongoDB.
      EDUCATION
      Bachelor of Computer Applications 2026
    `);

    expect(parsed.personalInfo.email).toBe("raj@example.com");
    expect(parsed.skills.technical).toEqual(
      expect.arrayContaining(["javascript", "react", "next.js", "node.js", "mongodb"]),
    );
    expect(parsed.experience[0]?.jobTitle).toContain("Backend Developer Intern");
    expect(parsed.experience[0]?.achievements.length).toBeGreaterThan(0);
    expect(parsed.projects[0]?.technologies).toContain("react");
    expect(parsed.education[0]?.degree).toContain("Bachelor");
  });

  it("separates required and preferred job skills", () => {
    const parsed = parseJobDescriptionLocally(`
      We require 3+ years of experience with JavaScript, React, Node.js and Docker.
      Responsibilities:
      • Build secure REST APIs and scalable services.
      • Collaborate with product and engineering teams.
      Nice to have: AWS and Kubernetes.
    `, "Full Stack Developer", "Acme");

    expect(parsed.minimumExperienceYears).toBe(3);
    expect(parsed.requiredSkills).toEqual(
      expect.arrayContaining(["javascript", "react", "node.js", "docker"]),
    );
    expect(parsed.preferredSkills).toEqual(expect.arrayContaining(["aws", "kubernetes"]));
    expect(parsed.responsibilities.length).toBeGreaterThan(0);
  });
});
