import { withBrowserPage } from "@server/browser/playwright";
import type { Contact, Cv, CvStyle, Entry, Section } from "@server/cv/schema";
import CSS from "@server/cv/styles.css" with { type: "text" };
import { marked, Renderer } from "marked";

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

/** normalizeForAts over every string in the CV; structured URLs pass through untouched. */
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

function sanitizeUrl(url: string): string | undefined {
	const u = url.trim();
	if (!u) return;
	if (/^(https?:|mailto:)/i.test(u)) return u;
	if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return;
	return u.includes("@") && !u.includes("/") ? `mailto:${u}` : `https://${u}`;
}

const inlineRenderer = new Renderer();
inlineRenderer.html = ({ text }) => esc(text);
inlineRenderer.image = ({ text }) => esc(text);
inlineRenderer.link = function ({ href, tokens }) {
	const label = this.parser.parseInline(tokens);
	const url = sanitizeUrl(href);
	return url ? `<a href="${esc(url)}">${label}</a>` : label;
};

function inlineMarkdownHtml(text: string): Html {
	return new Html(
		marked.parseInline(text, { async: false, renderer: inlineRenderer }),
	);
}

function contactHtml(contact: Contact): Html {
	const url = contact.url && sanitizeUrl(contact.url);
	return url
		? html`<a href="${url}">${contact.text}</a>`
		: html`${contact.text}`;
}

function entryHtml(e: Entry): Html {
	const meta = [e.dates, e.location].filter(Boolean).join(" | ");
	return html`<div class="entry">
		<h3><span>${inlineMarkdownHtml(e.title)}</span>${meta && html`<em class="meta">${meta}</em>`}</h3>
		${e.bullets?.length ? html`<ul>${e.bullets.map((b) => html`<li>${inlineMarkdownHtml(b)}</li>`)}</ul>` : ""}
	</div>`;
}

function sectionHtml(s: Section): Html {
	return html`<h2>${s.heading}</h2>
		${s.text && html`<p>${inlineMarkdownHtml(s.text)}</p>`}
		${(s.entries ?? []).map(entryHtml)}
		${(s.lines ?? []).map((l) => html`<p class="line"><strong>${l.label}:</strong> ${inlineMarkdownHtml(l.text)}</p>`)}`;
}

/** The full HTML document for a CV; renderCvPdf prints exactly this. */
export function cvHtml(cv: Cv, style: CvStyle = {}): string {
	const c = normalizeDeep(cv);
	const contacts = c.contacts
		.map(contactHtml)
		.reduce((a, b) => html`${a} | ${b}`);
	return html`<!doctype html><html lang="${c.lang}" style="${[
		style.accent && `--accent:${style.accent};`,
		style.size && `--size:${style.size}px;`,
	]}"><head><meta charset="utf-8"><style>${new Html(CSS)}</style></head><body>
		<h1>${c.name}</h1>
		${c.tagline && html`<p class="tagline">${c.tagline}</p>`}
		<p class="contacts">${contacts}</p>
		${c.sections.map(sectionHtml)}
	</body></html>`.s;
}

/** Render a structured CV to an ATS-safe, single-column A4 PDF. */
export async function renderCvPdf(
	cv: Cv,
	style: CvStyle = {},
): Promise<{ pdf: Uint8Array; pages: number }> {
	return withBrowserPage(async (page) => {
		await page.setContent(cvHtml(cv, style), { waitUntil: "load" });
		const pdf = await page.pdf({
			printBackground: true,
			preferCSSPageSize: true,
		});
		const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || [])
			.length;
		return { pdf, pages };
	});
}
