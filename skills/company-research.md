---
name: company-research
description: Research a company on the live web — use when the user asks about a company, wants context before applying, or is prepping for an interview and needs current signals.
---

# Company Research

Build a current picture of a company with `webSearch` and `webExtract`. The
posting tells you what the company says about itself; this skill is for what
everyone else says.

## Gather

1. **The target.** Company name from the conversation, or from a saved job
   (`query_db`: `SELECT title, content FROM job_postings WHERE id = ?`). The
   role shapes the research — a backend role cares about stack, a lead role
   about org health.
2. **Depth.** Match effort to the ask: a vibe-check before applying is 2-3
   searches; interview prep covers every axis below.

## Research

Work the axes with `webSearch`; pull the 1-3 most promising pages with
`webExtract` (engineering blog, news coverage, reviews). Prefer the last 6
months; date what you cite.

- **Product & strategy** — what they build, who pays for it, where they're
  headed.
- **Recent moves** — funding, layoffs, launches, pivots, leadership changes.
- **Engineering culture** — stack, how they ship, remote stance, what
  engineers say in reviews (Glassdoor, Blind).
- **Challenges** — scaling pains, migrations, reliability or cost pressure,
  complaints that repeat across reviews.
- **Competition** — main rivals and what differentiates the company.
- **The user's angle** — expand the relevant profile notes and connect: which
  of the user's experiences map to the challenges found? That's interview
  material.

Reviews skew negative and company blogs skew rosy — weigh both, and flag
contradictions instead of smoothing them over.

## Output

Short sections, one line per finding, each with its source URL — never a
table. Lead with the 2-3 findings that would change a decision (apply, prep,
negotiate). Close with the user's angle: 2-3 talking points tied to their
actual experience. If the web came back thin — small company, no reviews —
say so; silence is a data point too.
