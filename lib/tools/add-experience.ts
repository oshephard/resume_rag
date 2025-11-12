import { tool } from "ai";
import { z } from "zod";
import { createResource } from "../actions/resources";

export const addExperience = tool({
  description:
    "Add a new experience to your history. Though only date and description are required, prompt the user for more information if their description is vague or unclear.",
  inputSchema: z.object({
    date: z.string().describe("The date of the experience"),
    description: z
      .string()
      .describe("The description of the experience to add to your history"),
    title: z.string().describe("The title of the experience").optional(),
    company: z.string().describe("The company of the experience").optional(),
    position: z.string().describe("The position of the experience").optional(),
    location: z.string().describe("The location of the experience").optional(),
    url: z.string().describe("The URL of the experience").optional(),
    tags: z.array(z.string()).describe("The tags of the experience").optional(),
    skills: z
      .array(z.string())
      .describe("The skills of the experience")
      .optional(),
    tools: z
      .array(z.string())
      .describe("The tools of the experience")
      .optional(),
    technologies: z
      .array(z.string())
      .describe("The technologies of the experience")
      .optional(),
    projects: z
      .array(z.string())
      .describe("The projects of the experience")
      .optional(),
    education: z
      .array(z.string())
      .describe("The education of the experience")
      .optional(),
    certifications: z
      .array(z.string())
      .describe("The certifications of the experience")
      .optional(),
    awards: z
      .array(z.string())
      .describe("The awards of the experience")
      .optional(),
    publications: z
      .array(z.string())
      .describe("The publications of the experience")
      .optional(),
  }),
  execute: async ({
    date,
    description,
    title,
    company,
    position,
    location,
    url,
    tags,
    skills,
    tools,
    technologies,
    projects,
    education,
    certifications,
    awards,
    publications,
  }) => {
    const timestamp = new Date().toISOString();
    const documentName = `Experience - ${timestamp}`;

    const experienceParts = [
      `Date: ${date}`,
      `Description: ${description}`,
      title && `Title: ${title}`,
      company && `Company: ${company}`,
      position && `Position: ${position}`,
      location && `Location: ${location}`,
      url && `URL: ${url}`,
      tags && tags.length > 0 && `Tags: ${tags.join(", ")}`,
      skills && skills.length > 0 && `Skills: ${skills.join(", ")}`,
      tools && tools.length > 0 && `Tools: ${tools.join(", ")}`,
      technologies &&
        technologies.length > 0 &&
        `Technologies: ${technologies.join(", ")}`,
      projects && projects.length > 0 && `Projects: ${projects.join(", ")}`,
      education && education.length > 0 && `Education: ${education.join(", ")}`,
      certifications &&
        certifications.length > 0 &&
        `Certifications: ${certifications.join(", ")}`,
      awards && awards.length > 0 && `Awards: ${awards.join(", ")}`,
      publications &&
        publications.length > 0 &&
        `Publications: ${publications.join(", ")}`,
    ].filter(Boolean);

    const experience = experienceParts.map((part) => `    ${part}`).join("\n");

    const result = await createResource({
      content: experience.trim(),
      name: documentName,
    });

    return {
      success: true,
      documentId: result.documentId,
      chunksProcessed: result.chunksProcessed,
      message:
        "Experience stored successfully and is now available for RAG queries.",
    };
  },
});
