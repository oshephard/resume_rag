import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { readFileSync } from "fs";
import { join } from "path";

const TEMPLATE_PATH = join(process.cwd(), "lib/templates/ats-resume-template.md");

export function getATSTemplate(): string {
  try {
    return readFileSync(TEMPLATE_PATH, "utf-8");
  } catch (error) {
    console.error("Failed to read ATS template: ", error);
    throw new Error("ATS template file not found");
  }
}

export async function formatResumeToATS(rawResumeText: string): Promise<string> {
  const template = getATSTemplate();

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an expert resume formatter specializing in ATS (Applicant Tracking System) compatibility.

Your task is to reformat the provided resume content to match the ATS-friendly template structure exactly.

CRITICAL ATS-FRIENDLY FORMATTING RULES:
1. Use standard section headers exactly as shown in the template (e.g., "Professional Summary", "Professional Experience", "Education", "Skills")
2. Use simple markdown formatting: # for name, ## for section headers, ### for subsections, ** for bold
3. NO tables, columns, or complex layouts
4. NO special characters, symbols, or graphics
5. Use standard date formats: "Month YYYY" or "MM/YYYY"
6. Use standard bullet points (-) only
7. Keep formatting consistent and simple
8. Preserve all content from the original resume - do not omit information
9. Use clear, standard job titles and company names
10. Format contact information on a single line separated by pipes (|)
11. Use consistent spacing and structure throughout

MISSING INFORMATION HANDLING:
- When information is missing from the source resume, PRESERVE the template placeholders exactly as shown in brackets (e.g., [Full Name], [Email Address], [issuing Organization], [City, State])
- This helps users identify what information they need to fill in
- Only replace placeholders when you have the corresponding information from the source resume
- If a section is completely missing (e.g., no certifications), you may omit that section entirely
- For partial information (e.g., certification name but no issuing organization), fill in what you have and keep the placeholder for missing parts

When formatting:
- Extract and organize all information from the raw resume text
- Map information to the appropriate template sections
- Maintain chronological order (most recent first) for experience and education
- Use achievement-focused bullet points with action verbs
- Include quantifiable results where available
- Group related skills together
- Preserve all certifications, projects, and additional sections
- Keep template placeholders [like this] for any missing information

Return ONLY the formatted resume in markdown format matching the template structure. Do not include any explanations or comments.`,
      prompt: `ATS-FRIENDLY RESUME TEMPLATE:
${template}

RAW RESUME CONTENT TO FORMAT:
${rawResumeText}

Format the raw resume content to match the ATS-friendly template structure exactly. Preserve all information from the original resume while ensuring it follows ATS-friendly formatting guidelines.

IMPORTANT: When information is missing from the source resume, keep the template placeholders in brackets (e.g., [Full Name], [Email Address], [issuing Organization]) so users can identify what needs to be filled in. Only replace placeholders when you have the actual information from the source resume.`,
      temperature: 0.3,
    });

    return text;
  } catch (error) {
    console.error("Failed to format resume to ATS template: ", error);
    throw error;
  }
}

