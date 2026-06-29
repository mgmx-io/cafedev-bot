---
name: job-fit
description: Rank how well a saved job posting fits the user — use when they ask whether a job suits them, or after ingesting one and they want a fit assessment: a verdict plus the gaps.
---

# Job Fit

Rank how well a saved job posting fits the user. Fit is two matches, not one:

- **Can they do it?** what the user **is** (skills, experience) vs what the role
  **needs** (requirements).
- **Do they want it?** what the role **offers** (comp, remote, stack, scope,
  mission, growth) vs what the user **wants** (goals, preferences).

## Gather

1. **The JD.** Call `recall_job` with the posting's id (you got it from
   `ingest_job` earlier this conversation, or re-ingest the link to get it).
   This returns the full description.
2. **The profile.** The injected index lists what you know about the user. Pick
   the ids relevant to this role and call `recall_profile_notes` to expand them.
   If the profile is thin, say so — a fit ranking on no evidence is a guess.

## Analyze

1. **Role shape.** In one line: seniority, function (build / consult / manage /
   deploy), domain, remote (full / hybrid / onsite). Name the 1-2 things the
   role is really about.
2. **Capability — can they do it?** Map each real requirement (what the role
   *needs*) to the user's evidence (what they *are*):
   - **covered** — a profile note backs it (cite the note id)
   - **partial** — adjacent or weaker evidence
   - **gap** — nothing in the profile supports it
   Judge what the JD *requires*, not its boilerplate.
3. **Desirability — do they want it?** Map what the role *offers* (comp, remote,
   stack, scope, mission, growth) to what the user *wants* (cite the note id):
   - **met** / **partial** / **missing** — the offer against the want
   - **conflict** — the offer contradicts a stated want (onsite when they need
     remote, below their comp floor). A conflict on a deal-breaker is a hard stop.
   If the JD doesn't state something the user cares about (e.g. no comp listed),
   mark it unknown — don't assume.
4. **Gaps and interactions.** For each capability gap: hard blocker or
   nice-to-have? adjacent experience to lean on? And does the user *want* to grow
   there — a gap they want to close is a growth angle, not a disqualifier. A
   strong capability match they *don't* want is misalignment; don't oversell it.

## Verdict

No numeric score — an LLM's 1-5 is false precision. Give one of three calls,
grounded in the two tables and which gaps are blockers:

- **Apply** — covers the must-have requirements AND the offer fits what the user
  wants.
- **Stretch** — gaps or a soft blocker on either axis, but adjacent evidence or a
  growth the user wants makes a tailored shot worth it. Say what to address.
- **Skip** — a hard capability blocker (a missing must-have with no path), OR a
  deal-breaker conflict with what the user wants.

Both axes count: a job they can do but don't want is a Skip; a job they want but
can't do is a Stretch at best. JD red flags (vague scope, contradictory
seniority, unrealistic asks) pull the verdict down.

## Output

Give it in the message:

- One-line role shape + the **verdict** (Apply / Stretch / Skip)
- **Capability** table (need → evidence/note id → covered/partial/gap)
- **Desirability** table (offer → want/note id → met/partial/missing/conflict)
- Top 2-3 gaps or conflicts with mitigation
- A one-line reason for the verdict

Then persist it: call `record_fit` with the job's id and the verdict
(`apply` / `stretch` / `skip`).

Be direct. Never invent experience the user doesn't have — a gap honestly named
is more useful than a flattering match. Comp benchmarking and posting-legitimacy
checks need web access you don't have here; skip them and note it if it matters.
