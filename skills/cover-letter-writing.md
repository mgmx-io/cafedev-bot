---
name: cover-letter-writing
description: Tailored cover-letter writing for a specific job posting — use when drafting, rewriting, or adapting a cover letter for the user.
---

# Cover Letter Writing

The profile notes are the source of truth; the target posting drives every
choice. Never write a generic or placeholder letter. Ask for the posting when
it is missing.

## Gather

- If the user provided a URL, call `ingest_job`, then fetch the full description
  with `query_db`: `SELECT id, url, title, content FROM job_postings WHERE id =
  ?`.
- Expand the relevant profile notes with `query_db` before relying on dates,
  metrics, achievements, or scope.
- Identify a genuine motivation from the posting, a stored preference, or the
  user's words. Ask one concise question if guessing would make it generic.
- Verify additional company-specific claims with a current, preferably
  first-party source; otherwise omit them.

## Map before writing

- Extract the role's 3-5 real priorities and map them to direct, adjacent,
  unknown, or missing profile evidence.
- Choose the strongest 2-3 supported proof points. Prefer concrete outcomes,
  scope, and verified metrics over skill lists.
- Use the posting's vocabulary naturally. Never keyword-stuff or turn adjacent
  experience into a direct match.
- Apply the interview-backtrack test: the user must be able to defend every
  sentence without correcting its implication.
- Ask about an unknown only when it would materially change the letter. Omit an
  irrelevant gap; frame a relevant one honestly.

## Write

Use the posting's language unless the user requests another. Target 250-350
words and one page.

1. Address a confirmed person or the company's hiring team.
2. Open with the role, the strongest candidate-to-need connection, and a
   specific motivation.
3. Focus on what the user can solve and how, backed by 2-3 brief proof points
   rather than a CV recap.
4. Connect the user to a concrete employer priority, product, domain, or way of
   working.
5. Close confidently. Mention location, authorization, availability, or
   language only when relevant and confirmed.

Use prose by default; use at most three short bullets when they materially
improve scanning.

## Voice

- Warm, direct, conversational-professional, first person, and active voice.
- Show examples and outcomes instead of naming traits.
- Vary sentence openings and lengths.
- Do not use em dashes.
- Cut filler openers like "I am writing to express my interest."
- Avoid: passionate about, perfect fit, results-oriented, proven track record,
  leverage, spearheaded, synergies, robust, seamless, cutting-edge, innovative,
  demonstrated ability to, best practices, hit the ground running.

## Final check

Verify every candidate claim against the user's messages, profile, or documents,
and every company claim against the posting or a verified source. Confirm the
company, role, recipient, language, and logistics. Cut anything that could be
sent unchanged to another employer, repeats the CV, or adds filler.

Deliver the finished letter directly in chat with its salutation and closing.
Put any material assumption or omitted gap in one brief sentence after it.
