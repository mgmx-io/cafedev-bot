import type { Cv, Entry, Section } from "@/cv/schema";

/** Typographic Unicode to ASCII — ATS parsers garble it into mojibake or split words. */
function normalizeForAts(text: string): string {
	return text
		.replace(/[—–]/g, "-")
		.replace(/[“”„‟]/g, '"')
		.replace(/[‘’‚‛]/g, "'")
		.replace(/…/g, "...")
		.replace(/​|‌|‍|⁠|﻿/g, "")
		.replace(/ /g, " ")
		.replace(/\s*→\s*/g, " to ")
		.replace(/\s*←\s*/g, " from ")
		.replace(/\s*[↑↓]\s*/g, " ")
		.replace(/\s*[·•]\s*/g, " | ")
		.replace(/€/g, "EUR ")
		.replace(/£/g, "GBP ");
}

const ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ESCAPES[c] ?? c);

/** Normalized and escaped: every text value passes through here. */
const t = (s: string) => esc(normalizeForAts(s));

function sanitizeUrl(url: string): string {
	const u = url.trim();
	if (/^(https?:|mailto:)/i.test(u)) return u;
	return u.includes("@") && !u.includes("/") ? `mailto:${u}` : `https://${u}`;
}

// Generic tags + static system fonts: variable webfonts make PDF extractors
// inject spurious spaces inside words, corrupting ATS keyword parsing.
const CSS = `
	body { font: 11px/1.45 'Liberation Sans', 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
	h1 { font-size: 26px; margin: 0 0 2px; letter-spacing: -0.02em; }
	.tagline, .contacts { color: #555; margin: 0; }
	.contacts { margin-bottom: 14px; }
	h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: hsl(187, 74%, 32%); border-bottom: 1.5px solid #e2e2e2; padding-bottom: 3px; margin: 14px 0 8px; }
	h3 { font-size: 11.5px; margin: 10px 0 4px; display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
	h3 em { font-weight: 400; font-size: 11px; color: #555; white-space: nowrap; }
	p { margin: 6px 0; }
	.line { margin: 3px 0; }
	ul { margin: 4px 0; padding-left: 16px; }
	li { margin: 2px 0; }
	a { color: #0b5394; text-decoration: none; white-space: nowrap; }
	.entry { break-inside: avoid; }
`;

function entryHtml(e: Entry): string {
	const meta = [e.dates, e.location]
		.flatMap((v) => (v ? [t(v)] : []))
		.join(" | ");
	const bullets = e.bullets?.length
		? `<ul>${e.bullets.map((b) => `<li>${t(b)}</li>`).join("")}</ul>`
		: "";
	return `<div class="entry"><h3><span>${t(e.title)}</span>${meta ? `<em>${meta}</em>` : ""}</h3>${bullets}</div>`;
}

function sectionHtml(s: Section): string {
	return [
		`<h2>${t(s.heading)}</h2>`,
		s.text ? `<p>${t(s.text)}</p>` : "",
		...(s.entries ?? []).map(entryHtml),
		...(s.lines ?? []).map(
			(l) => `<p class="line"><strong>${t(l.label)}:</strong> ${t(l.text)}</p>`,
		),
	].join("");
}

/** The full HTML document for a CV; renderCvPdf prints exactly this. */
export function cvHtml(cv: Cv): string {
	const contacts = cv.contacts
		.map((c) =>
			c.url
				? `<a href="${esc(sanitizeUrl(c.url))}">${t(c.text)}</a>`
				: t(c.text),
		)
		.join(" | ");
	const body = [
		`<h1>${t(cv.name)}</h1>`,
		cv.tagline ? `<p class="tagline">${t(cv.tagline)}</p>` : "",
		`<p class="contacts">${contacts}</p>`,
		...cv.sections.map(sectionHtml),
	].join("");
	return `<!doctype html><html lang="${esc(cv.lang)}"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;
}

/** Render a structured CV to an ATS-safe, single-column A4 PDF. */
export async function renderCvPdf(
	cv: Cv,
): Promise<{ pdf: Uint8Array; pages: number }> {
	const view = new Bun.WebView({
		backend: { type: "chrome", argv: ["--no-sandbox"] },
	});

	try {
		await view.navigate(
			`data:text/html;charset=utf-8;base64,${Buffer.from(cvHtml(cv)).toString("base64")}`,
		);
		const { data } = (await view.cdp("Page.printToPDF", {
			printBackground: true,
			marginTop: 0.6,
			marginBottom: 0.6,
			marginLeft: 0.6,
			marginRight: 0.6,
			paperWidth: 8.27,
			paperHeight: 11.69,
		})) as { data: string };
		const pdf = Buffer.from(data, "base64");
		const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || [])
			.length;
		return { pdf, pages };
	} finally {
		view.close();
	}
}
