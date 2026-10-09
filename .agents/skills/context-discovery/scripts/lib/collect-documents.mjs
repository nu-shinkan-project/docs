import { lstat, realpath, readdir, readFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { extractFrontmatter } from "./frontmatter.mjs";
import { classify, excludedNames, within } from "./document-selection.mjs";

export async function collectDocuments({ roots, selections }) {
  const documents = [];
  const diagnostics = [];
  const visited = new Set();
  async function visit(path, explicit, includeTemplates) {
    try {
      const info = await lstat(path);
      if (info.isSymbolicLink() && !explicit) return;
      const target = await realpath(path);
      const rootId = ["docs", "main"].find(
        (id) => roots[id] && within(roots[id], target),
      );
      if (!rootId) throw new Error("Target is outside the selected roots.");
      if (visited.has(target)) return;
      const localPath = relative(roots[rootId], target).replaceAll("\\", "/");
      if (localPath.split("/").some((part) => excludedNames.has(part))) return;
      if (!includeTemplates && localPath.split("/").includes("templates"))
        return;
      visited.add(target);
      const targetInfo = info.isSymbolicLink() ? await lstat(target) : info;
      if (targetInfo.isDirectory()) {
        const children = await readdir(target);
        for (const name of children.sort())
          await visit(join(target, name), false, includeTemplates);
      } else if (targetInfo.isFile() && basename(target).endsWith(".md")) {
        const document = {
          rootId,
          path: localPath,
          kind: classify(rootId, localPath),
          metadata: {},
          diagnostics: [],
        };
        try {
          Object.assign(
            document,
            extractFrontmatter(await readFile(target, "utf8")),
          );
        } catch (error) {
          document.diagnostics.push({
            code: "document-unreadable",
            message: error.message,
          });
        }
        documents.push(document);
      }
    } catch (error) {
      const rootId = ["docs", "main"].find(
        (id) => roots[id] && within(roots[id], path),
      );
      diagnostics.push({
        code: "directory-unreadable",
        ...(rootId
          ? {
              rootId,
              path: relative(roots[rootId], path).replaceAll("\\", "/"),
            }
          : {}),
        message: error.message,
      });
    }
  }
  for (const selection of selections) {
    await visit(
      selection.path,
      selection.explicit,
      selection.explicit &&
        relative(roots[selection.rootId], selection.path)
          .split(/[\\/]/)
          .includes("templates"),
    );
  }
  documents.sort((a, b) =>
    a.rootId < b.rootId
      ? -1
      : a.rootId > b.rootId
        ? 1
        : a.path < b.path
          ? -1
          : a.path > b.path
            ? 1
            : 0,
  );
  if (
    diagnostics.length ||
    documents.some((document) => document.diagnostics.length)
  )
    diagnostics.push({
      code: "scanning-incomplete",
      message: "Some requested documents could not be listed, read, or parsed.",
    });
  return { schemaVersion: 1, documents, diagnostics };
}
