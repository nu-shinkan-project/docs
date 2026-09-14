---
relevant-to: Creating, modifying, or reorganizing agent instructions and skills
---

# Agent Resource Organization

Follow the [documentation policy](../../policy/documentation.md) for placement,
classification, metadata, and editing permissions.

* Put global behavioral rules in `docs/instructions/`, local instructions
  in the affected directory, and task-specific procedures in `.agents/skills/`.
* Use concrete file and directory names that identify the subject. Avoid `misc/`
  and `other/`. Add hierarchy when it improves discovery, not to balance file counts.
* Do not maintain exhaustive instruction or skill indexes in `AGENTS.md` or READMEs.
  Use directory structure, names, and metadata for discovery.
* Link to design and policy documents rather than duplicating their content in instructions.
* Keep short procedures inside an instruction when splitting them would not improve clarity.
* Skills use the standard `SKILL.md` structure and metadata.
