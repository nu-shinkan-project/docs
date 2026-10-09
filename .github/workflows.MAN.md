# Nightly ADR監査の実行

[nightly-adr-audit.yml](workflows/nightly-adr-audit.yml)は、docsリポジトリのmainにあるdraft ADRをGitHub Copilot CLIで監査する。毎日03:00 JSTに実行し、Actionsの「Nightly ADR audit」からmainを指定して手動実行もできる。定期実行を開始するにはworkflowをデフォルトブランチへ反映する。

## 実行に必要な設定

組織のCopilot CLI設定で「Allow use of Copilot CLI billed to the organization」を有効にする。認証にはActionsの`GITHUB_TOKEN`を使い、workflowに`copilot-requests: write`を付与している。追加のAPIキーやPATは不要で、利用料金は組織に計上される。詳細は[GitHub公式の設定手順](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli-in-actions)を参照する。

## 結果の確認と反映

既存の[adr-auditスキル](../.agents/skills/adr-audit/SKILL.md)に従ってmetadataとADR本文の整合性を確認し、作業領域内でADRのfront matterを更新する。`audit: conflict`のdraftも再監査する。

Actionsの実行サマリーで監査結果を確認できる。`adr-audit-result` artifactには報告書の`adr-audit-report.md`、更新差分の`adr-audit.patch`、監査対象のコミットSHAを記録した`adr-audit-base.txt`、監査後のmetadataを収集した`adr-audit-metadata.json`を14日間保存する。対象がない場合や未評価の対象も報告書で確認する。

workflowの`contents`権限は読み取りだけで、更新をpushしない。差分を反映するときはartifactをダウンロードして内容を確認し、監査対象のコミットをもとに変更を取り込む。mainが更新されている場合は、ADRの変更が監査結果に影響しないか確認する。

## 競合のIssue通知

監査とmetadata収集が正常に完了すると、`report-conflicts` jobが監査後の`status: draft / audit: conflict`のADRごとにIssueを作成する。通知jobだけに`issues: write`を付与し、Copilotが実行する監査jobにはIssueの書き込み権限を付与しない。

Issueには対象ADR、ADR ID、監査コミット、監査結果へのリンクを記録する。同じADR IDの通知マーカーを持つ未解決Issueがあれば再作成しない。ADRのファイル名が変わってもIDで照合する。既存Issueが閉じられた後も競合が残っていれば、新しいIssueを作成する。競合解消時のIssueの自動クローズは行わない。

metadataの収集が不完全な場合や、競合ADRのIDが欠落・重複している場合は、通知処理を失敗させる。Issue作成の失敗は`report-conflicts` jobのログで確認する。

Copilotの認証やCLI実行が失敗した場合は、失敗したstepのログと組織設定を確認する。報告書が生成されなかった場合も実行サマリーに記録する。
