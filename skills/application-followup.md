---
name: application-followup
description: Triage the user's tracked jobs and recommend the next action — use when they ask what to do next, want to review their applications, or report a status change like applying or landing an interview.
---

# Application Followup

Move the user's job pipeline forward: surface the next action for each tracked
job, and record the status changes they report.

## Gather

- The injected block shows counts and how many jobs are rated 'apply' but not
  yet applied to.
- Call `list_jobs` for the actual rows — id, title, status, fit.

## Triage by fit + status

The next action depends on both axes:

- **considering · fit apply** — the priority. Nudge to apply now; offer to tailor
  first using what you know from the profile. This is the "rated apply but not
  applied" signal.
- **considering · fit stretch** — decide together: tailor and apply, or drop.
  Name the gap that makes it a stretch.
- **considering · fit skip** — suggest dropping it (`set_status` withdrawn)
  unless something changed.
- **considering · not evaluated** — run the `job-fit` skill first.
- **applied** — keep it warm: a brief follow-up note is reasonable; prep for a
  reply.
- **interviewing** — shift to prep: likely questions and stories from the
  profile mapped to the role.
- **offer** — help evaluate and negotiate, against what the user wants.
- **rejected** — extract one learning. If it reveals a gap or preference, save it
  with `add_profile_note`.

## Record changes

When the user reports a transition ("I applied", "they want a call"), call
`set_status` with the new status. If they give a fresh verdict, `record_fit`.

## Output

A short, prioritized list — the 2-3 jobs that need action now, each with its one
next step. Lead with the urgent (apply-but-not-applied first); don't dump the
whole pipeline.

Elapsed-time cadence ("you applied three weeks ago, follow up") isn't available
yet — status changes carry no timestamp. Don't guess how long ago something
happened.
