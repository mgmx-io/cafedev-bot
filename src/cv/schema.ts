import { z } from "zod";

const entrySchema = z.object({
	title: z.string().describe("E.g. 'Acme - Senior Engineer' or a degree."),
	dates: z.string().optional(),
	location: z.string().optional(),
	bullets: z.array(z.string()).optional(),
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
		.array(z.object({ label: z.string(), text: z.string() }))
		.optional()
		.describe("'Label: item, item' lines for Skills or Core Competencies."),
});

const contactSchema = z.object({
	text: z
		.string()
		.describe(
			"Visible text; for links a readable URL, e.g. 'linkedin.com/in/jane'.",
		),
	url: z
		.string()
		.optional()
		.describe("Link target; omit for plain text like a city."),
});

// The CV as its three ATS-safe typographic shapes: dated entries, labeled lines, paragraphs.
export const cvSchema = z.object({
	lang: z.string().describe("CV language as a BCP 47 tag, e.g. 'en', 'es'."),
	name: z.string(),
	tagline: z
		.string()
		.optional()
		.describe("One line under the name, e.g. 'Senior Backend Engineer'."),
	contacts: z.array(contactSchema).describe("Email, city, relevant links."),
	sections: z
		.array(sectionSchema)
		.describe(
			"All field values are plain text — markdown syntax renders literally.",
		),
});

export type Cv = z.infer<typeof cvSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Section = z.infer<typeof sectionSchema>;
