---
name: cv-writing
description: ATS-friendly CV writing — use when drafting or tailoring a CV for the user.
---

# CV Writing

The profile notes are the source of truth for facts; the target posting drives
every choice. Ask for the posting if it's not in context — a generic CV
underperforms a tailored one, and say so if the user wants one anyway.

Before drafting, briefly map the posting's important requirements to supporting
evidence and its best CV placement. Ask when missing information could
materially change the CV.

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
  count, so trim and resend if over. Cut duplicated or least-relevant content
  first.

## Keywords

- Extract the required and high-signal preferred terms.
- Use the posting's exact vocabulary naturally and close to the evidence that
  supports it.
- Reorder each role's bullets by relevance to the posting; keep only the 3-4
  most relevant projects.

## Writing

- Start bullets with a strong verb and describe a concrete outcome or scope.
  Include verified metrics when they sharpen the outcome.
- Specifics over abstractions: "Cut p95 latency from 2.1s to 380ms" beats
  "improved performance".
- Vary bullet openers and sentence lengths.
- Banned: passionate about, results-oriented, proven track record, leveraged,
  spearheaded, facilitated, synergies, robust, seamless, cutting-edge,
  innovative, demonstrated ability to, best practices.

Before `send_cv`, verify once that every factual claim is supported, important
supported keywords appear naturally, and the CV has no filler or repetition.
