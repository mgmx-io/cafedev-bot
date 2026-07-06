import { z } from "zod";

const entrySchema = z.object({
	title: z.string().describe("E.g. 'Acme - Senior Engineer' or a degree."),
	dates: z
		.string()
		.optional()
		.describe(
			"Month-year range, e.g. 'Jan 2020 - Mar 2023' or 'Jan 2020 - Present'.",
		),
	location: z
		.string()
		.optional()
		.describe("E.g. 'Berlin, Germany' or 'Remote'."),
	bullets: z
		.array(z.string())
		.optional()
		.describe("One achievement per bullet, starting with an action verb."),
});

const sectionSchema = z.object({
	heading: z
		.string()
		.describe("Section name parsers expect, e.g. 'Work Experience'."),
	text: z.string().optional().describe("Paragraph content, e.g. the Summary."),
	entries: z
		.array(entrySchema)
		.optional()
		.describe("Dated entries: roles, projects, education, certifications."),
	lines: z
		.array(
			z.object({
				label: z.string().describe("E.g. 'Languages'."),
				text: z
					.string()
					.describe("Comma-separated items, e.g. 'TypeScript, Go, SQL'."),
			}),
		)
		.optional()
		.describe("'Label: item, item' lines for Skills or Core Competencies."),
});

const contactSchema = z.object({
	text: z.string().describe("Visible text."),
	url: z
		.string()
		.optional()
		.describe("Link target; omit for plain text like a city."),
});

// The CV as its three ATS-safe typographic shapes: dated entries, labeled lines, paragraphs.
export const cvSchema = z.object({
	lang: z.string().describe("CV language as a BCP 47 tag, e.g. 'en', 'es'."),
	name: z.string().describe("Full name, plain text."),
	tagline: z
		.string()
		.optional()
		.describe(
			"Target job title under the name, e.g. 'Senior Backend Engineer'.",
		),
	contacts: z
		.array(contactSchema)
		.min(1)
		.describe("Email, city, relevant links."),
	sections: z
		.array(sectionSchema)
		.describe(
			"All field values are plain text — markdown syntax renders literally.",
		),
});

// Typographic knobs only; layout stays fixed single-column for ATS.
export const styleSchema = z.object({
	accent: z
		.string()
		.regex(/^#[0-9a-f]{6}$/i)
		.optional()
		.describe("Heading and link color as hex, e.g. '#2e7d32'."),
	size: z
		.number()
		.min(9.5)
		.max(12)
		.optional()
		.describe("Base font size in px; smaller fits more per page."),
});

export type Cv = z.infer<typeof cvSchema>;
export type CvStyle = z.infer<typeof styleSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Section = z.infer<typeof sectionSchema>;
