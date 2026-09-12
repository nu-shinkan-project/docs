---
relevant-to: All tasks
---

# Repository Context Discovery

First, read `nu-shinkan.wiki/policy/documentation.md` to understand the documentation system and its conventions.

Then discover the context relevant to the current task in the following order.

## 1. Rules and Lessons

Inspect the directory trees of:

* `nu-shinkan.wiki/instructions/`
* `nu-shinkan.wiki/policy/`
* `nu-shinkan.wiki/lessons/`

Use file names and locations to identify potentially relevant documents.

Use `relevant-to` only to filter candidate documents. For candidates that remain, read the full content and determine applicability from the document itself.

Treat these document types according to their role:

* `instructions/`: mandatory instructions
* `policy/`: mandatory project-wide rules and policies
* `lessons/`: non-mandatory guidance derived from prior experience

Applicable instructions and policies must be followed. Relevant lessons should be considered when making implementation or design decisions.

## 2. Design Context

Inspect the directory tree of `nu-shinkan.wiki/design/`.

Identify and read documents relevant to the current task to understand the existing design, structure, and intended behavior before making substantial changes.

## 3. Additional Context

When necessary, inspect relevant documents in:

* `nu-shinkan.wiki/explanation/`
* `nu-shinkan.wiki/ADR/`
* `.agents/skills/`

Use these sources when additional background, historical decisions, rationale, or task-specific procedures are needed.
