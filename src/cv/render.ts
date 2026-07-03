import { marked } from "marked";

/** Typographic Unicode to ASCII — ATS parsers garble it into mojibake or split words. */
function normalizeForAts(text: string): string {
	return text
		.replace(/[—–]/g, "-")
		.replace(/[“”„‟]/g, '"')
		.replace(/[‘’‚‛]/g, "'")
		.replace(/…/g, "...")
		.replace(/​|‌|‍|⁠|﻿/g, "")
		.replace(/ /g, " ")
		.replace(/\s*→\s*/g, " to ")
		.replace(/\s*←\s*/g, " from ")
		.replace(/\s*[↑↓]\s*/g, " ")
		.replace(/\s*[·•]\s*/g, " | ")
		.replace(/€/g, "EUR ")
		.replace(/£/g, "GBP ");
}

// Generic tags + system fonts: any structure renders and PDF text extracts cleanly.
const CSS = `
	body { font: 11px/1.45 'Liberation Sans', 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
	h1 { font-size: 26px; margin: 0 0 2px; letter-spacing: -0.02em; }
	h1 + p { color: #555; margin: 0 0 14px; }
	h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: hsl(187, 74%, 32%); border-bottom: 1.5px solid #e2e2e2; padding-bottom: 3px; margin: 14px 0 8px; }
	h3 { font-size: 11.5px; margin: 10px 0 0; }
	h3 + p { margin: 0 0 4px; }
	p { margin: 6px 0; }
	em { color: #555; }
	ul { margin: 4px 0; padding-left: 16px; }
	li { margin: 2px 0; }
	a { color: #0b5394; text-decoration: none; }
`;

/** Render a markdown CV to an ATS-safe, single-column A4 PDF. */
export async function renderCvPdf(markdown: string): Promise<Uint8Array> {
	const body = await marked.parse(normalizeForAts(markdown));
	const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;
	const view = new Bun.WebView({ backend: "chrome" });

	try {
		await view.navigate(
			`data:text/html;charset=utf-8;base64,${Buffer.from(html).toString("base64")}`,
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
		return Buffer.from(data, "base64");
	} finally {
		view.close();
	}
}
