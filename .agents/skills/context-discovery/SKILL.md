---
name: context-discovery
description: "リポジトリ作業に適用する規約・指示・設計を探索し、必要なら文書のフロントマターを収集する。"
---

# 文脈の探索

このスキルの実体はdocsリポジトリの `.agents/skills/context-discovery/` にある。本文のリンクは実体を基準に読む。メインから公開symlinkを辿れない場合は `docs/.agents/skills/context-discovery/SKILL.md` を直接読む。

まず[文書運用規則](../../../policy/documentation.md)を読み、文書種別・効力・編集権限を確認する。メイン作業ではdocsがメインルートの `docs/` にあることを確認し、取得できない場合はAGENTS.mdに従って停止する。docs単独の作業にはメインを必要としない。

1. docsルートの `instructions/`・`policy/`・`lessons/` のツリーを確認し、名称と配置から関連候補を探す。`relevant-to` は候補の絞り込みだけに使い、残った候補の全文から適用条件を判断する。metadataの欠落だけで候補を捨てない。適用される指示・規約に従い、知見は非強制の参考として考慮する。
2. `design/` と作業対象に関係するローカル設計・AGENTS.md・*.INSTR.mdを調べる。[保護条件](../../../instructions/documentation/document-protection.md)を読み、設計上の合意と実装の現状を区別する。
3. 必要に応じて `explanation/`・`ADR/`・`snippets/` と作業スキルを確認する。docsのスキルはdocsルートの `.agents/skills/`、メイン作業のスキルはメインルートの `.agents/skills/` から、名前・descriptionで発見する。スキル名の記述が自動的な再帰呼び出しを起こすとは仮定せず、必要なSKILL.mdを明示して読む。
4. 適用する根拠と不足情報を把握して作業へ進む。確認済みの文脈を固有スキルで使い、対象や前提が広がった場合に探索を追加する。

文書候補が多い場合は[metadata収集コマンド](references/metadata-collection.md)を使える。本文を読む代わりにはしない。規約への適合検証を求められた場合は[docs-audit](../docs-audit/SKILL.md)を利用する。共通探索の実施に監査は必須ではない。

NodeやYAML依存が未準備でも、docsルートで `rg --files instructions policy lessons design` などを実行し、候補本文を直接読んで探索できる。隠しディレクトリのスキル・ローカル指示を探す場合は `rg --files --hidden` も使う。依存導入前には[package-manager](../../../instructions/tooling/package-manager.md)等の適用規則を確認する。コマンド失敗は直接読取で補える範囲を確認し、残る未評価を報告する。取得不能な文書の内容は推測しない。
