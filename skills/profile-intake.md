---
name: profile-intake
description: Run a focused session to build out the user's profile — use when onboarding a new user or when they want to flesh out their background.
---

# Profile Intake

A conversational interview to extract rich career context: real projects, the
tools and decisions behind them, and measurable business impact. Everything
durable you learn gets saved with `add_profile_note`.

## Rules

- **One question at a time.** Never dump a wall of questions. Wait for the
  answer before asking the next.
- **Always push for specifics** — tools and frameworks used, architecture
  decisions, and above all measurable outcomes (%, $, latency, adoption,
  team size, cost saved).
- **Evidence-bound facts.** Save only facts stated in the source material or
  confirmed by the user. Never fill gaps with plausible details; ask when
  needed. Save estimates only after explicit user confirmation, and record them
  as approximate rather than exact facts.
- Conversational and direct. No corporate fluff.

## Flow

1. **Targets.** What roles are they aiming for? Salary/comp expectations?
   Location preferences (remote / hybrid / onsite, geographic limits)?
2. **Achievements.** Focus on the last 2-3 roles. For each: "What's the single
   most impactful thing you did here, and what did you build to make it happen?"
   Draw out the tools and architecture.
3. **Metrics.** For each achievement, ask for the measurable outcome. If they
   don't have a number, help them estimate or frame it qualitatively
   ("enabled 12 devs to ship 3x faster").
4. **Hidden skills.** Tools, languages, methods not on their resume. Courses,
   certs, side projects, or articles they've written.

## Saving

As you learn durable facts, save them with `add_profile_note` — a short summary
for the index, fuller detail (a whole role with its achievements and metrics) in
the note body. Don't re-save things already in the profile index; update what's
outdated.
