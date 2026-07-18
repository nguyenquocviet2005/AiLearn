# AiLearn Checkpoint 2 Demo Plan

## Purpose

Demonstrate a closed, teacher-controlled learning loop using synthetic Grade 7 mathematics data:

```text
student evidence
→ class snapshot
→ teaching priorities and temporary groups
→ editable lesson plan
→ teacher approval and publication
→ intervention outcomes
→ printable fallback
```

The walkthrough must never use real student data. Identifiers beginning with `stu_g7_` are synthetic.

## Canonical scenario

- Class: `class_g7a_demo`
- Lesson: `lesson_g7_inverse_proportion_01`
- Lesson topic: inverse proportion and work-rate transfer
- Synthetic roster: 40 learners
- Planning evidence: 800 readiness events, 20 per learner
- Post-intervention evidence: eight outcome events isolated after the planning cutoff
- Teacher plan: four activities totaling 45 minutes
- Printable report: `report_demo_01`
- Public frontend: <https://ai-learn-web-eight.vercel.app>

The committed class and lesson fixtures are generated from the same deterministic readiness projection used by the API fallback. The intervention report is later than the generated plan and references a separate synthetic post-intervention evidence fixture. Its explicit planning cutoff prevents later outcome evidence from changing the earlier class snapshot or lesson plan.

## Presenter setup

1. Use a private browser window or a clean browser profile.
2. Confirm the public frontend opens without authentication.
3. Open the teacher workspace directly at `/teacher`.
4. Keep a second physical device ready on a different browser or network when possible.
5. Do not assume the plan is version 1. Rehearsals create immutable versions.
6. Record the current version, decision, and total time before editing.
7. Never enter real names or classroom information.

## Five-minute presenter script

### 1. Start from class evidence — 60 seconds

Open `/teacher`.

Say:

> AiLearn turns short student responses into a class-level teaching view. It ranks what is most teachable now while keeping insufficient evidence separate from diagnosed needs.

Show:

- the 40-learner synthetic class total;
- readiness, support, and confirmation counts;
- ranked prerequisite priorities;
- root-cause distribution;
- the confirmation boundary;
- temporary intervention groups and their learner lists.

Expected checkpoint:

- technical IDs identify the synthetic class and lesson;
- group totals cover every diagnosed learner exactly once;
- insufficient evidence is not shown as failure or a negative learner label.

### 2. Review the generated lesson plan — 45 seconds

Open `/teacher/lesson-plan`.

Say:

> The system proposes a 45-minute sequence, but the teacher controls timing, grouping, approval, and publication.

Show the four activities:

1. readiness confirmation warm-up;
2. guided prerequisite repair;
3. intervention-group target practice;
4. near-transfer exit evidence.

Read out the current plan version and decision.

### 3. Make a controlled teacher edit — 75 seconds

Use an edit that preserves the 45-minute total:

1. increase the readiness warm-up from 5 to 6 minutes;
2. reduce the near-transfer exit evidence from 10 to 9 minutes;
3. expand the first group containing more than one learner;
4. move one synthetic learner to another intervention group;
5. select **Save teacher edit**.

Expected checkpoint:

- the save button is disabled before a change and enabled after a valid change;
- approval and rejection are unavailable while edits are unsaved;
- the saved version number increases by exactly one;
- a success message announces the new version;
- the total remains 45 minutes.

### 4. Prove preservation and teacher authority — 60 seconds

On the second device, open `/teacher/lesson-plan` directly and refresh it.

Verify:

- the version matches the version saved on the first device;
- both duration edits remain;
- the learner remains in the selected group.

On either device, select **Approve plan**.

Verify after refresh:

- the version increases by one;
- the teacher decision is approved while the generated or edited plan content remains unchanged;
- the approval control is no longer repeatable;
- publication becomes available.

Select **Publish plan** only when the presenter intends to complete the lifecycle. Verify that publication creates one more version and cannot be repeated from that published version.

### 5. Close the evidence loop — 60 seconds

Open `/teacher/report`.

Say:

> AiLearn separates supported success from independent transfer and carries unresolved gaps into the next teaching decision.

Show the five representative outcome states:

- passed independent transfer;
- still struggling;
- root cause reclassified;
- incomplete;
- teacher escalation.

Point out the evidence IDs, remaining gaps, and next-lesson focus.

Open `/teacher/report/print` and select **Print report and lesson plan**. Confirm the report remains useful if the matching plan is temporarily unavailable.

## Cross-device verification record

Record these fields in the submission notes:

| Field                            | Device A    | Device B    |
| -------------------------------- | ----------- | ----------- |
| Device and OS                    |             |             |
| Browser and version              |             |             |
| Network                          |             |             |
| Starting version                 |             |             |
| Saved version                    |             |             |
| Approved version                 |             |             |
| Edited durations preserved       | PASS / FAIL | PASS / FAIL |
| Group move preserved             | PASS / FAIL | PASS / FAIL |
| Approval preserved after refresh | PASS / FAIL | PASS / FAIL |
| No localhost API request         | PASS / FAIL | PASS / FAIL |

## Screenshot package

The capture specification is ready before merge. Final binary screenshots and the PDF are intentionally produced from the merged Vercel deployment so they cannot misrepresent a local or preview build. They are a post-merge manual acceptance gate because Vercel production ownership is restricted.

Capture at desktop and phone width where practical:

1. `01-class-overview.png` — summary, top priorities, and evidence boundary.
2. `02-intervention-groups.png` — group cards with one learner list expanded.
3. `03-lesson-plan-edit.png` — changed durations, group editor, and unsaved state.
4. `04-version-saved.png` — success message and incremented version.
5. `05-plan-approved.png` — approved status and publication enabled.
6. `06-intervention-report.png` — outcome counts, evidence table, and next focus.
7. `07-print-preview.png` — browser print preview showing report and lesson plan.
8. `08-second-device-proof.png` — the preserved approved version on Device B.

Screenshots must not expose browser credentials, private tabs, environment values, or real student information.

## Printable fallback

The `/teacher/report/print` route:

- loads the intervention report first;
- combines it only with the matching class and lesson plan;
- remains printable when the plan request fails;
- does not depend on external images;
- uses A4 print rules and avoids splitting key evidence cards where possible.

Save the print preview as `ailearn-checkpoint-2-teacher-report.pdf` for the submission package.

## Pass criteria

- All four teacher routes support direct navigation and refresh.
- No page is blank and no route shows a generic deployment fallback.
- All requests use the configured API origin; production never targets localhost.
- Valid edits create a new immutable version.
- Invalid duration totals cannot be saved.
- Stale-version conflicts tell the teacher to refresh.
- Approval is required before publication.
- Saved edits and approval survive refresh on a second device.
- Report and printable fallback match the same class, lesson, and plan.
- Keyboard focus, touch targets, loading feedback, retry actions, and mobile layouts remain usable.

## Post-merge owner action

Vercel dashboard access is owner-only. After merge, the repository owner must confirm the production deployment uses the merged commit and verify the Vercel production branch, Root Directory (`apps/web`), build settings, SPA rewrite, and `VITE_API_BASE_URL` scope before capturing final production screenshots, completing the second-device table, and exporting the final PDF. Until those artifacts are recorded, the production/cross-device portion of VAI-25 remains pending even if CI passes.
