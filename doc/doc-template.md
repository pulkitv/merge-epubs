# Documentation & Sprint Planning — Template

This file defines the conventions for maintaining project documentation. Follow these when starting a new sprint, updating architecture docs, or adding new reference material.

---

## Directory Layout

```
doc/
├── architecture.md        # Living architecture doc — always up to date
├── sprint-YYYY-MM.md      # One file per calendar month
├── doc-template.md        # This file
└── (optional extras)      # e.g., api-reference.md, decisions.md
```

---

## How to Start a New Sprint File

Create `doc/sprint-YYYY-MM.md` at the beginning of each month. Use the structure below.

```markdown
# Sprint Log — [Month] [Year]

**Period**: YYYY-MM-01 to YYYY-MM-[last day]
**Theme**: [One-line description of the sprint's main focus]

---

## Goals

- [Goal 1]
- [Goal 2]
- [Goal 3]

---

## What We Built

### [Feature or Area Name]

[2–4 sentences describing what was built and why it matters to users or the system.]

**What it does:**
- [Bullet 1]
- [Bullet 2]

**Key decisions:**
- [Decision]: [Why we made this choice, not just what we chose]

---

## Timeline

| Date | Work Done |
|------|-----------|
| YYYY-MM-DD | [Concise description of what was done] |
| YYYY-MM-DD | [Concise description] |

---

## Outcome

[2–3 sentences. What state is the project in now? What does a user or developer get out of this sprint?]

---

## Carry-Over / Next Sprint

- [Thing not finished or deferred]
- [New idea that emerged during the sprint]
```

---

## How to Update `architecture.md`

Update `architecture.md` whenever any of the following change:

| Change type | What to update |
|-------------|---------------|
| New feature or tab | Add to "What This Project Is" section and document its state object fields |
| New state variable | Add to "State Management" section |
| New API endpoint | Add to the API endpoints table |
| New routing rule | Update the routing table |
| New external dependency | Add to "Tech Stack" table |
| Security change | Update "Security Considerations" |
| Known constraint resolved | Remove from "Known Constraints" or update it |
| New known constraint added | Add to "Known Constraints & Future Work" |

**Never let `architecture.md` get more than one sprint behind.** An outdated architecture doc is worse than no doc — it misleads the next developer (or AI agent) who reads it.

### Architecture update checklist

Before marking a sprint as done, verify:

- [ ] All new state fields are documented in "State Management"
- [ ] Any new route is in the routing table
- [ ] Any new API endpoint is documented
- [ ] "Last Updated" date at the top is current
- [ ] "Known Constraints" reflects the real current state
- [ ] No references to code or files that no longer exist

---

## Writing Conventions

**Sprint logs** capture *what happened and why* — they are the project's memory. Future developers and AI agents will read them to understand choices that aren't obvious from the code.

**Architecture doc** captures *how the system works right now*. It should always be accurate. It is not a history document — old information gets removed or updated, not appended.

**What to write:**
- Decisions and the reasoning behind them ("Why client-side EPUB generation instead of the API?")
- Non-obvious constraints ("Render free tier sleeps after inactivity — first request takes ~30s")
- What was tried and abandoned, briefly ("Initial attempt used a Vercel proxy; removed because...")
- Actual dates from git log, not vague ("early February")

**What not to write:**
- Obvious implementation details already clear from the code
- Lines like "updated styles" without saying what changed and why
- Hypothetical future work in the architecture doc (that belongs in sprint carry-over)

---

## Adding Other Documentation Files

If a topic is large enough to need its own file, create it in `doc/` and add a line to the index below.

Good candidates for separate files:
- `api-reference.md` — detailed API request/response examples if the backend grows
- `decisions.md` — architectural decisions log (ADR-style) for major irreversible choices
- `extension-integration.md` — detailed Chrome extension protocol if it becomes complex
- `auth.md` — authentication flows if server-side validation is added

---

## Documentation Index

Update this table whenever a new doc file is created.

| File | Purpose | Update frequency |
|------|---------|-----------------|
| `architecture.md` | How the system works right now | Every sprint |
| `sprint-YYYY-MM.md` | What was built and why that month | Once per month |
| `doc-template.md` | This file — conventions and templates | When conventions change |

---

## Quick Reference: What Goes Where

| Information type | Where it goes |
|-----------------|---------------|
| Current system architecture | `architecture.md` |
| Why a feature was built a certain way | Sprint log for that month |
| What was done in a given month | Sprint log for that month |
| API endpoint details | `architecture.md` (summary) or `api-reference.md` (full) |
| Planned future work | Carry-Over section of the most recent sprint |
| Security model | `architecture.md` → Security section |
| Deployment steps | `architecture.md` → Deployment section |
