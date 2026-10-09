import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { planConflictIssues, selectConflicts } from "./conflicts.mjs";

export async function reportConflicts({
  github,
  context,
  core,
  resultDirectory,
}) {
  const collection = JSON.parse(
    await readFile(join(resultDirectory, "adr-audit-metadata.json"), "utf8"),
  );
  const conflicts = selectConflicts(collection);
  core.info(`Conflicting draft ADRs: ${conflicts.length}`);
  if (!conflicts.length) {
    await core.summary
      .addRaw("ADR競合はありません。Issueの作成対象はありません。")
      .write();
    return;
  }
  const base = (
    await readFile(join(resultDirectory, "adr-audit-base.txt"), "utf8")
  ).trim();
  if (!/^[0-9a-f]{40}$/.test(base))
    throw new Error("Invalid audit base commit SHA.");
  const repositoryUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}`;
  const runUrl = `${repositoryUrl}/actions/runs/${context.runId}`;
  const issues = await github.paginate(github.rest.issues.listForRepo, {
    ...context.repo,
    state: "open",
    per_page: 100,
  });
  for (const { conflict, marker, issue } of planConflictIssues(
    conflicts,
    issues,
  )) {
    if (issue) {
      core.info(
        `Existing conflict issue for ${conflict.path}: #${issue.number}`,
      );
      core.summary
        .addLink(`${conflict.path}: 既存Issue #${issue.number}`, issue.html_url)
        .addEOL();
      continue;
    }
    const adrUrl = `${repositoryUrl}/blob/${base}/${conflict.path.split("/").map(encodeURIComponent).join("/")}`;
    const { data: created } = await github.rest.issues.create({
      ...context.repo,
      title: `ADR競合: ${conflict.path}`,
      body: [
        marker,
        "Nightly ADR監査の結果、対象ADRは `status: draft / audit: conflict` です。",
        "",
        `- 対象ADR: [${conflict.path}](${adrUrl})`,
        `- ADR ID: \`${conflict.metadata.id}\``,
        `- 監査コミット: [${base}](${repositoryUrl}/commit/${base})`,
        `- [監査結果と更新差分](${runUrl})（実行サマリーと adr-audit-result artifact）`,
        "",
        "監査結果を確認し、競合する判断のどれを採用するか、またはsupersedesによる置換が必要かを判断してください。",
        "競合を解消したdraft ADRは次回のNightly監査で再評価されます。",
      ].join("\n"),
    });
    core.info(
      `Created conflict issue for ${conflict.path}: #${created.number}`,
    );
    core.summary
      .addLink(
        `${conflict.path}: 作成したIssue #${created.number}`,
        created.html_url,
      )
      .addEOL();
  }
  await core.summary.write();
}
