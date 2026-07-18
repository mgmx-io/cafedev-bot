---
name: auto-apply
description: Fill and submit a job application for the user through the interactive browser.
---

# Auto Apply

Use the browser tools to complete a job application from the user's real profile
and artifacts.

## Flow

1. Open the posting or application URL with `browser_open`.
2. Use the returned snapshot's exact accessible roles and names with
   `browser_act`. Prefer batches of independent fields.
3. Continue through intermediate steps and inspect each returned snapshot.
4. Ask one concise question when a required answer is missing. Keep the browser
   open while waiting.
5. Before the final submit, summarize the company, role, CV filename, and any
   material answers. Ask for explicit confirmation and stop.
6. Only after the user confirms, click the final submit control. Mark the job
   `applied` only when the page clearly confirms success.
7. Call `browser_close` when submitted, cancelled, or blocked.

## Rules

- Never invent personal details, work authorization, sponsorship answers,
  salary expectations, legal attestations, or demographic information.
- Never answer voluntary demographic questions unless the user supplied the
  exact answer for this application.
- Use `query_db` to load relevant profile notes and CV artifact ids.
- Upload files with the file input's visible label and the chosen artifact id.
- If a CAPTCHA, login challenge, assessment, or inaccessible control blocks
  progress, tell the user where it stopped instead of trying to bypass it.
