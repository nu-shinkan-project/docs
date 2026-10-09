import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { selectAuditTargets } from "./targets.mjs";

export async function prepareAudit({ core, resultDirectory }) {
  const collection = JSON.parse(
    await readFile(join(resultDirectory, "adr-audit-before.json"), "utf8"),
  );
  const targets = selectAuditTargets(collection);
  await writeFile(
    join(resultDirectory, "adr-audit-targets.json"),
    JSON.stringify(
      targets.map(({ path }) => path),
      null,
      2,
    ),
  );
  core.setOutput("has-targets", targets.length > 0 ? "true" : "false");
  core.info(`Pending draft ADRs selected for audit: ${targets.length}`);
  if (!targets.length) {
    core.info(
      "No draft ADRs with audit: pending; Copilot audit will be skipped.",
    );
    await writeFile(
      join(resultDirectory, "adr-audit-report.md"),
      "status: draft かつ audit: pending のADRがないため、監査をスキップしました。\n",
    );
  }
}
