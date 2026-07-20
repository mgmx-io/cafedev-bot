---
name: cv-writing
description: ATS-friendly CV writing — use when drafting or tailoring a CV for the user.
---

# CV Writing

The profile notes are the source of truth for facts; the target posting drives
every choice. Ask for the posting if it's not in context — a generic CV
underperforms a tailored one, and say so if the user wants one anyway.

CV language = posting language. Deliver the finished CV with `send_cv`, named
for the recruiter: `Jane-Doe-CV-Acme.pdf`.

## Format

- Sections named what parsers expect: Summary, Core Competencies, Work
  Experience, Projects, Education, Skills, Certifications — in that order,
  only the ones the profile supports, reverse chronological.
- Each role: title `Company - Role`, dates and location, then 2-5 bullets.
- Titles, paragraphs, bullets, and labeled-line text support inline Markdown.
  Use links, bold, and emphasis sparingly; HTML and images are disabled.
- Link a project's primary destination in its title; link a PR, article, or
  demo where it is mentioned. Keep general profiles in contacts.
- One page under ~10 years of experience, two max — send_cv returns the page
  count, so trim and resend if over. Cut oldest roles first.

## Keywords

- Extract 15-20 keywords from the posting.
- Distribute them where parsers and recruiters look: top 5 in the Summary,
  the first bullet of each role, and the Skills section.
- Reword real experience into the posting's exact vocabulary — profile says
  "LLM workflows with retrieval", posting says "RAG pipelines", write "RAG
  pipeline design and LLM orchestration workflows". Never add a skill the
  profile doesn't back.
- Reorder each role's bullets by relevance to the posting; keep only the 3-4
  most relevant projects.

## Writing

- Every bullet: strong verb first, then a real metric (%, $, latency, team
  size) taken from the profile notes — never invented.
- Specifics over abstractions: "Cut p95 latency from 2.1s to 380ms" beats
  "improved performance".
- Vary bullet openers and sentence lengths.
- Banned: passionate about, results-oriented, proven track record, leveraged,
  spearheaded, facilitated, synergies, robust, seamless, cutting-edge,
  innovative, demonstrated ability to, best practices.

If the CV needs a metric or date the profile doesn't have, ask — one question
at a time — instead of padding.
