import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { selectAuditTargets } from "./lib/adr-audit-targets.mjs";

try {
  const { values } = parseArgs({ options: { input: { type: "string" } } });
  if (!values.input)
    throw new Error("--input is required (a collection file path).");
  const collection = JSON.parse(await readFile(values.input, "utf8"));
  const targets = selectAuditTargets(collection);
  console.log(
    JSON.stringify(
      targets.map(({ path }) => path),
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
