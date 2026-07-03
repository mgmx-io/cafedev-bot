import type { Contact, Cv, Entry, Section } from "@/cv/schema";
import CSS from "@/cv/styles.css" with { type: "text" };

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

/** Rendered markup; interpolating it into html`` skips escaping. */
class Html {
	constructor(readonly s: string) {}
}

/** Escapes every interpolated value; Html fragments (and arrays of them) pass through raw. */
function html(strings: TemplateStringsArray, ...values: unknown[]): Html {
	const render = (v: unknown): string =>
		v == null || v === false
			? ""
			: v instanceof Html
				? v.s
				: Array.isArray(v)
					? v.map(render).join("")
					: esc(String(v));
	return new Html(
		strings.reduce((acc, s, i) => acc + render(values[i - 1]) + s),
	);
}

/** normalizeForAts over every string in the CV; URLs pass through untouched. */
function normalizeDeep<T>(v: T): T {
	if (typeof v === "string") return normalizeForAts(v) as T;
	if (Array.isArray(v)) return v.map(normalizeDeep) as T;
	if (v && typeof v === "object")
		return Object.fromEntries(
			Object.entries(v).map(([k, x]) => [
				k,
				k === "url" ? x : normalizeDeep(x),
			]),
		) as T;
	return v;
}

function sanitizeUrl(url: string): string {
	const u = url.trim();
	if (/^(https?:|mailto:)/i.test(u)) return u;
	return u.includes("@") && !u.includes("/") ? `mailto:${u}` : `https://${u}`;
}

function contactHtml(c: Contact): Html {
	return c.url
		? html`<a href="${sanitizeUrl(c.url)}">${c.text}</a>`
		: html`${c.text}`;
}

function entryHtml(e: Entry): Html {
	const meta = [e.dates, e.location].filter(Boolean).join(" | ");
	return html`<div class="entry">
		<h3><span>${e.title}</span>${meta && html`<em>${meta}</em>`}</h3>
		${e.bullets?.length ? html`<ul>${e.bullets.map((b) => html`<li>${b}</li>`)}</ul>` : ""}
	</div>`;
}

function sectionHtml(s: Section): Html {
	return html`<h2>${s.heading}</h2>
		${s.text && html`<p>${s.text}</p>`}
		${(s.entries ?? []).map(entryHtml)}
		${(s.lines ?? []).map((l) => html`<p class="line"><strong>${l.label}:</strong> ${l.text}</p>`)}`;
}

/** The full HTML document for a CV; renderCvPdf prints exactly this. */
export function cvHtml(cv: Cv): string {
	const c = normalizeDeep(cv);
	const contacts = c.contacts
		.map(contactHtml)
		.reduce((a, b) => html`${a} | ${b}`);
	return html`<!doctype html><html lang="${c.lang}"><head><meta charset="utf-8"><style>${new Html(CSS)}</style></head><body>
		<h1>${c.name}</h1>
		${c.tagline && html`<p class="tagline">${c.tagline}</p>`}
		<p class="contacts">${contacts}</p>
		${c.sections.map(sectionHtml)}
	</body></html>`.s;
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
			preferCSSPageSize: true,
		})) as { data: string };
		const pdf = Buffer.from(data, "base64");
		const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || [])
			.length;
		return { pdf, pages };
	} finally {
		view.close();
	}
}
