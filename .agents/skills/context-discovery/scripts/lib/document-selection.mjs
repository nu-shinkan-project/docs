import { isAbsolute, relative, resolve, sep, basename } from "node:path";
import { realpath, stat } from "node:fs/promises";

export const standardDirectories = [
  "instructions",
  "policy",
  "lessons",
  "design",
  "explanation",
  "ADR",
  "snippets",
];
export const excludedNames = new Set([
  ".git",
  "node_modules",
  ".agents/handoff",
  "handoff",
  ".pnpm-store",
  ".turbo",
  "dist",
  "build",
  "coverage",
  ".generated",
  ".artifacts",
]);
export const within = (root, path) => {
  const part = relative(root, path);
  return (
    part === "" ||
    (!isAbsolute(part) && part !== ".." && !part.startsWith(`..${sep}`))
  );
};

export function classify(rootId, path) {
  const name = basename(path);
  if (path.split("/").includes("templates")) return "template";
  if (name === "SKILL.md") return "skill";
  if (name === "AGENTS.md" || name.endsWith(".INSTR.md"))
    return "local-instruction";
  const globalKinds = {
    ADR: "adr",
    instructions: "global-instruction",
    snippets: "snippet",
    lessons: "lesson",
    policy: "policy",
    design: "design",
    explanation: "explanation",
  };
  if (rootId === "docs" && globalKinds[path.split("/")[0]])
    return globalKinds[path.split("/")[0]];
  if (name.endsWith(".DESG.md")) return "local-design";
  if (name.endsWith(".EXPL.md")) return "local-explanation";
  if (name.endsWith(".MAN.md") || name === "README.md") return "local-manual";
  return "unknown";
}

export async function resolveSelections({ docsRoot, mainRoot, paths = [] }) {
  if (!docsRoot) throw new Error("--docs-root is required.");
  const roots = { docs: await realpath(resolve(docsRoot)) };
  if (mainRoot) roots.main = await realpath(resolve(mainRoot));
  for (const root of Object.values(roots)) {
    if (!(await stat(root)).isDirectory())
      throw new Error("Each root must be a directory.");
  }
  const selections = [];
  for (const selection of paths) {
    const match = /^(docs|main):(.+)$/.exec(selection);
    if (!match || !roots[match[1]])
      throw new Error(`Invalid or undefined root in --path: ${selection}`);
    const [rootId, part] = match.slice(1);
    if (
      isAbsolute(part) ||
      !within(roots[rootId], resolve(roots[rootId], part))
    )
      throw new Error(`Path is outside its root: ${selection}`);
    const path = resolve(roots[rootId], part);
    const target = await realpath(path);
    if (!Object.values(roots).some((root) => within(root, target)))
      throw new Error(
        `Link target is outside the selected roots: ${selection}`,
      );
    selections.push({ rootId, path, explicit: true });
  }
  if (!paths.length) {
    for (const part of standardDirectories)
      selections.push({
        rootId: "docs",
        path: resolve(roots.docs, part),
        explicit: false,
      });
  }
  return { roots, selections };
}
